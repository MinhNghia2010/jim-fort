"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

type MemberActionState = {
  error?: string
}

async function getMemberContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as a member to continue." }
  }

  if (user.app_metadata.app_role !== "member") {
    return { error: "Only members can use this action." }
  }

  return { supabase, memberId: user.id }
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function parseInteger(value: string) {
  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : null
}

function parseChoice(value: string, choices: readonly string[]) {
  return choices.includes(value) ? value : null
}

const weeklySlotIndexes = [0, 1, 2, 3, 4, 5, 6]

export async function createMemberSubscription(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const packageId = stringValue(formData, "packageId")

  if (!packageId) {
    return { error: "Select a membership plan." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: plan, error: planError } = await context.supabase
    .from("membership_packages")
    .select("facility_id")
    .eq("id", packageId)
    .single()

  if (planError || !plan) {
    return { error: "This membership plan is not available." }
  }

  const { data, error } = await context.supabase
    .from("membership_subscriptions")
    .insert({
      member_id: context.memberId,
      facility_id: plan.facility_id,
      package_id: packageId,
    })
    .select("id")
    .single()

  if (error) {
    return { error: `Unable to create subscription: ${error.message}` }
  }

  revalidatePath("/memberships")
  revalidatePath("/subscriptions")
  redirect(`/subscriptions/${data.id}`)
}

export async function savePtPreference(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const subscriptionId = stringValue(formData, "subscriptionId")
  const preferredPtId = stringValue(formData, "preferredPtId")
  const preferredPtGender = parseChoice(stringValue(formData, "preferredPtGender"), [
    "no_preference",
    "male",
    "female",
  ])
  const experienceLevel = parseChoice(stringValue(formData, "experienceLevel"), [
    "no_preference",
    "beginner",
    "intermediate",
    "advanced",
  ])
  const trainingGoal = stringValue(formData, "trainingGoal")
  const notes = stringValue(formData, "notes")

  if (!subscriptionId) {
    return { error: "Select a PT subscription." }
  }

  if (!preferredPtGender || !experienceLevel) {
    return { error: "Select valid PT preferences." }
  }

  const incompleteSlot = weeklySlotIndexes.some((index) => {
    const start = stringValue(formData, `slotStart${index}`)
    const end = stringValue(formData, `slotEnd${index}`)

    return Boolean(start) !== Boolean(end)
  })

  if (incompleteSlot) {
    return { error: "Choose both start and end time for each selected day." }
  }

  const slots = weeklySlotIndexes
    .map((index) => {
      const day = parseInteger(stringValue(formData, `slotDay${index}`))
      const start = stringValue(formData, `slotStart${index}`)
      const end = stringValue(formData, `slotEnd${index}`)

      if (!start && !end) {
        return null
      }

      if (day === null) {
        return null
      }

      return {
        day_of_week: day,
        start_time: start,
        end_time: end,
      }
    })
    .filter(
      (
        slot
      ): slot is {
        day_of_week: number
        start_time: string
        end_time: string
      } => Boolean(slot)
    )

  if (!slots.length) {
    return {
      error: "Choose at least one day and time for PT sessions.",
    }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const payload = {
    subscription_id: subscriptionId,
    preferred_pt_id: preferredPtId || null,
    preferred_pt_gender: preferredPtGender,
    sessions_per_week: slots.length,
    training_goal: trainingGoal || null,
    experience_level: experienceLevel,
    notes: notes || null,
  }

  const { data, error } = await context.supabase
    .from("membership_pt_preferences")
    .upsert(payload, { onConflict: "subscription_id" })
    .select("id")
    .single()

  if (error) {
    return { error: `Unable to save PT preferences: ${error.message}` }
  }

  const { error: deleteError } = await context.supabase
    .from("membership_pt_preference_time_slots")
    .delete()
    .eq("pt_preference_id", data.id)

  if (deleteError) {
    return { error: `Unable to replace availability: ${deleteError.message}` }
  }

  if (slots.length) {
    const { error: slotError } = await context.supabase
      .from("membership_pt_preference_time_slots")
      .insert(slots.map((slot) => ({ ...slot, pt_preference_id: data.id })))

    if (slotError) {
      return { error: `Unable to save availability: ${slotError.message}` }
    }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")

  return {}
}

export async function decidePtAssignment(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const assignmentId = stringValue(formData, "assignmentId")
  const subscriptionId = stringValue(formData, "subscriptionId")
  const decision = parseChoice(stringValue(formData, "decision"), [
    "accepted",
    "rejected",
  ])
  const note = stringValue(formData, "note")

  if (!assignmentId || !subscriptionId || !decision) {
    return { error: "Select a valid PT assignment decision." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { error } = await context.supabase
    .from("membership_pt_assignments")
    .update({
      status: decision,
      member_response_note: note || (decision === "accepted" ? "Accepted." : "Rejected."),
    })
    .eq("id", assignmentId)

  if (error) {
    return { error: `Unable to update PT assignment: ${error.message}` }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")

  return {}
}

export async function applyVoucher(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const subscriptionId = stringValue(formData, "subscriptionId")
  const code = stringValue(formData, "code").toUpperCase()

  if (!subscriptionId || !code) {
    return { error: "Enter a voucher code." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: voucher, error: voucherError } = await context.supabase
    .from("vouchers")
    .select("id")
    .eq("code", code)
    .single()

  if (voucherError || !voucher) {
    return { error: "Voucher is unavailable or cannot be used here." }
  }

  const { error } = await context.supabase.from("voucher_redemptions").insert({
    voucher_id: voucher.id,
    member_id: context.memberId,
    subscription_id: subscriptionId,
  })

  if (error) {
    return { error: `Unable to apply voucher: ${error.message}` }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/payments")

  return {}
}

export async function paySubscription(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const subscriptionId = stringValue(formData, "subscriptionId")
  const method = parseChoice(stringValue(formData, "method"), [
    "cash",
    "bank_transfer",
    "card",
    "e_wallet",
    "other",
  ])

  if (!subscriptionId || !method) {
    return { error: "Choose a valid payment method." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: subscription, error: subscriptionError } = await context.supabase
    .from("membership_subscriptions")
    .select("final_price")
    .eq("id", subscriptionId)
    .eq("member_id", context.memberId)
    .single()

  if (subscriptionError || !subscription) {
    return { error: "This subscription is not available for payment." }
  }

  const { error } = await context.supabase.from("membership_payments").insert({
    subscription_id: subscriptionId,
    member_id: context.memberId,
    amount: subscription.final_price,
    method,
    status: "paid",
  })

  if (error) {
    return { error: `Unable to complete payment: ${error.message}` }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")
  revalidatePath("/payments")

  return {}
}

export async function createFacilityFeedback(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const facilityId = stringValue(formData, "facilityId")
  const subject = stringValue(formData, "subject")
  const message = stringValue(formData, "message")
  const ratingValue = stringValue(formData, "rating")
  const rating = ratingValue ? parseInteger(ratingValue) : null

  if (!facilityId) {
    return { error: "Select a facility." }
  }

  if (!subject || !message) {
    return { error: "Enter a subject and message." }
  }

  if (rating !== null && (rating < 1 || rating > 5)) {
    return { error: "Rating must be between 1 and 5." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { error } = await context.supabase.from("facility_feedbacks").insert({
    facility_id: facilityId,
    member_id: context.memberId,
    subject,
    message,
    rating,
  })

  if (error) {
    return { error: `Unable to submit feedback: ${error.message}` }
  }

  revalidatePath("/feedback")

  return {}
}

export async function markSessionFeedbackRead(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const sessionId = stringValue(formData, "sessionId")
  const feedbackId = stringValue(formData, "feedbackId")

  if (!sessionId || !feedbackId) {
    return { error: "Select valid session feedback." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { error } = await context.supabase
    .from("pt_session_feedbacks")
    .update({ status: "read" })
    .eq("id", feedbackId)

  if (error) {
    return { error: `Unable to mark feedback read: ${error.message}` }
  }

  revalidatePath(`/schedule/sessions/${sessionId}`)
  revalidatePath(`/schedule/sessions/${sessionId}/feedback`)
  revalidatePath("/schedule")

  return {}
}
