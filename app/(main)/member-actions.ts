"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { withRedirectToast } from "@/lib/redirect-toast"
import { createClient } from "@/lib/supabase/server"

type MemberActionState = {
  error?: string
  message?: string
}

type SubscriptionStatus =
  | "pending_pt_setup"
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled"

type ActiveSubscription = {
  id: string
  package_id: string
  has_pt_snapshot: boolean
  activated_at: string | null
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

type PaidSubscription = ActiveSubscription & {
  member_id: string
  facility_id: string
  duration_days_snapshot: number | null
}

const pendingSubscriptionStatuses: SubscriptionStatus[] = [
  "pending_pt_setup",
  "pending_payment",
]

function friendlySubscriptionError(message: string) {
  if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
    return "Backend subscription updates need SUPABASE_SERVICE_ROLE_KEY in the server environment."
  }

  if (message.toLowerCase().includes("pending")) {
    return "You already have a pending membership. Please pay it or cancel it before choosing another plan."
  }

  return message
}

function parseDate(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function latestDate(...values: (string | null)[]) {
  const dates = values
    .map(parseDate)
    .filter((date): date is Date => Boolean(date))

  if (!dates.length) {
    return null
  }

  return new Date(Math.max(...dates.map((date) => date.getTime())))
}

function pickExtensionBase(
  currentSubscription: PaidSubscription,
  activeSubscriptions: ActiveSubscription[]
) {
  const samePlanSubscriptions = activeSubscriptions.filter(
    (subscription) =>
      subscription.package_id === currentSubscription.package_id &&
      subscription.has_pt_snapshot === false &&
      currentSubscription.has_pt_snapshot === false
  )

  return samePlanSubscriptions.reduce<Date | null>((latest, subscription) => {
    const candidate = latestDate(
      subscription.expires_at,
      subscription.starts_at,
      subscription.activated_at,
      subscription.created_at
    )

    if (!candidate) {
      return latest
    }

    if (!latest || candidate > latest) {
      return candidate
    }

    return latest
  }, null)
}

async function cancelFuturePtSessions(
  subscriptionIds: string[],
  cancelledAt: string
) {
  if (!subscriptionIds.length) {
    return null
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from("membership_pt_sessions")
    .update({ status: "cancelled" })
    .in("subscription_id", subscriptionIds)
    .eq("status", "scheduled")
    .gte("starts_at", cancelledAt)

  return error
}

async function settleSingleActiveSubscription(
  subscriptionId: string,
  memberId: string
) {
  const admin = createAdminClient()

  const { data: currentSubscription, error: currentError } = await admin
    .from("membership_subscriptions")
    .select(
      "id,member_id,facility_id,package_id,has_pt_snapshot,duration_days_snapshot,activated_at,starts_at,expires_at,created_at"
    )
    .eq("id", subscriptionId)
    .eq("member_id", memberId)
    .eq("status", "active")
    .single()

  if (currentError || !currentSubscription) {
    return currentError ?? new Error("The paid subscription was not activated.")
  }

  const paidSubscription = currentSubscription as PaidSubscription

  const { data: activeRows, error: activeError } = await admin
    .from("membership_subscriptions")
    .select(
      "id,package_id,has_pt_snapshot,activated_at,starts_at,expires_at,created_at"
    )
    .eq("member_id", memberId)
    .eq("facility_id", paidSubscription.facility_id)
    .eq("status", "active")
    .neq("id", subscriptionId)
    .order("activated_at", { ascending: false })

  if (activeError) {
    return activeError
  }

  const activeSubscriptions = (activeRows ?? []) as ActiveSubscription[]
  const cancelledAt = new Date().toISOString()
  const extensionBase = paidSubscription.duration_days_snapshot
    ? pickExtensionBase(paidSubscription, activeSubscriptions)
    : null

  if (extensionBase && paidSubscription.duration_days_snapshot) {
    const startsAt =
      paidSubscription.starts_at ??
      activeSubscriptions.find(
        (subscription) =>
          subscription.package_id === paidSubscription.package_id
      )?.starts_at ??
      paidSubscription.activated_at ??
      cancelledAt
    const expiresAt = addDays(
      extensionBase,
      paidSubscription.duration_days_snapshot
    ).toISOString()

    const { error: extendError } = await admin
      .from("membership_subscriptions")
      .update({ starts_at: startsAt, expires_at: expiresAt })
      .eq("id", subscriptionId)

    if (extendError) {
      return extendError
    }
  }

  const samePlanIds = activeSubscriptions
    .filter(
      (subscription) => subscription.package_id === paidSubscription.package_id
    )
    .map((subscription) => subscription.id)
  const differentPlanIds = activeSubscriptions
    .filter(
      (subscription) => subscription.package_id !== paidSubscription.package_id
    )
    .map((subscription) => subscription.id)
  const replacedSubscriptionIds = [...samePlanIds, ...differentPlanIds]

  const sessionError = await cancelFuturePtSessions(
    replacedSubscriptionIds,
    cancelledAt
  )

  if (sessionError) {
    return sessionError
  }

  if (samePlanIds.length) {
    const { error } = await admin
      .from("membership_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
        cancelled_reason: `Extended into subscription ${subscriptionId}.`,
      })
      .in("id", samePlanIds)

    if (error) {
      return error
    }
  }

  if (differentPlanIds.length) {
    const { error } = await admin
      .from("membership_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
        cancelled_reason: `Replaced by subscription ${subscriptionId}.`,
      })
      .in("id", differentPlanIds)

    if (error) {
      return error
    }
  }

  return null
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

type PaymentDetailPayload = {
  payer_name: string | null
  payer_phone: string | null
  cardholder_name: string | null
  card_last_four: string | null
  card_expiry: string | null
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "")
}

function normalizeCardExpiry(value: string) {
  const compactValue = value.replace(/\s/g, "")
  const match = compactValue.match(/^(\d{1,2})\/?(\d{2}|\d{4})$/)

  if (!match) {
    return null
  }

  const month = Number(match[1])

  if (month < 1 || month > 12) {
    return null
  }

  return `${String(month).padStart(2, "0")}/${match[2].slice(-2)}`
}

function getEmptyPaymentDetails(): PaymentDetailPayload {
  return {
    payer_name: null,
    payer_phone: null,
    cardholder_name: null,
    card_last_four: null,
    card_expiry: null,
  }
}

function buildPaymentDetails(
  method: string,
  formData: FormData
):
  | { details: PaymentDetailPayload; error?: never }
  | { error: string; details?: never } {
  const details = getEmptyPaymentDetails()

  if (method === "card") {
    const cardholderName = stringValue(formData, "cardholderName")
    const cardNumber = digitsOnly(stringValue(formData, "cardNumber"))
    const cardExpiry = normalizeCardExpiry(stringValue(formData, "cardExpiry"))
    const cardCvv = digitsOnly(stringValue(formData, "cardCvv"))

    if (!cardholderName) {
      return { error: "Enter the cardholder name." }
    }

    if (cardNumber.length < 13 || cardNumber.length > 19) {
      return { error: "Enter a valid card number." }
    }

    if (!cardExpiry) {
      return { error: "Enter a valid card expiry in MM/YY format." }
    }

    if (cardCvv.length < 3 || cardCvv.length > 4) {
      return { error: "Enter a valid card CVC." }
    }

    details.cardholder_name = cardholderName
    details.card_last_four = cardNumber.slice(-4)
    details.card_expiry = cardExpiry

    return { details }
  }

  return { details }
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

  const { data: existingSubscriptions, error: existingError } =
    await context.supabase
      .from("membership_subscriptions")
      .select("id,status,package_id,created_at")
      .eq("member_id", context.memberId)
      .eq("facility_id", plan.facility_id)
      .in("status", [...pendingSubscriptionStatuses, "active"])
      .order("created_at", { ascending: false })

  if (existingError) {
    return {
      error: `Unable to check current subscriptions: ${existingError.message}`,
    }
  }

  const pendingSubscription = existingSubscriptions?.find((subscription) =>
    pendingSubscriptionStatuses.includes(
      subscription.status as SubscriptionStatus
    )
  )

  if (pendingSubscription) {
    return {
      error:
        "You already have a pending membership. Please pay it or cancel it before choosing another plan.",
    }
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
    return {
      error: `Unable to create subscription: ${friendlySubscriptionError(error.message)}`,
    }
  }

  revalidatePath("/memberships")
  revalidatePath("/subscriptions")
  redirect(
    withRedirectToast(
      `/subscriptions/${data.id}`,
      "Membership subscription created."
    )
  )
}

export async function cancelPendingSubscription(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const subscriptionId = stringValue(formData, "subscriptionId")

  if (!subscriptionId) {
    return { error: "Select a pending subscription." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: subscription, error: subscriptionError } =
    await context.supabase
      .from("membership_subscriptions")
      .select("id,status")
      .eq("id", subscriptionId)
      .eq("member_id", context.memberId)
      .single()

  if (subscriptionError || !subscription) {
    return { error: "This subscription is not available." }
  }

  if (
    !pendingSubscriptionStatuses.includes(
      subscription.status as SubscriptionStatus
    )
  ) {
    return { error: "Only pending subscriptions can be cancelled here." }
  }

  try {
    const cancelledAt = new Date().toISOString()
    const admin = createAdminClient()

    const { error } = await admin
      .from("membership_subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: cancelledAt,
        cancelled_reason: "Cancelled by member before payment.",
      })
      .eq("id", subscriptionId)
      .eq("member_id", context.memberId)
      .in("status", pendingSubscriptionStatuses)

    if (error) {
      return {
        error: `Unable to cancel subscription: ${friendlySubscriptionError(error.message)}`,
      }
    }

    const { error: paymentError } = await admin
      .from("membership_payments")
      .update({ status: "cancelled" })
      .eq("subscription_id", subscriptionId)
      .eq("member_id", context.memberId)
      .eq("status", "pending")

    if (paymentError) {
      return {
        error: `Subscription was cancelled, but pending payment cleanup failed: ${paymentError.message}`,
      }
    }
  } catch (error) {
    return {
      error: friendlySubscriptionError(
        error instanceof Error ? error.message : String(error)
      ),
    }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")
  redirect(
    withRedirectToast("/subscriptions", "Subscription was cancelled.")
  )
}

export async function savePtPreference(
  _state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const subscriptionId = stringValue(formData, "subscriptionId")
  const rawPreferredPtId = stringValue(formData, "preferredPtId")
  const preferredPtId = rawPreferredPtId === "none" ? "" : rawPreferredPtId
  const preferredPtGender = parseChoice(
    stringValue(formData, "preferredPtGender"),
    ["no_preference", "male", "female"]
  )
  const experienceLevel = parseChoice(
    stringValue(formData, "experienceLevel"),
    ["no_preference", "beginner", "intermediate", "advanced"]
  )
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
  revalidatePath("/request")
  revalidatePath(`/request/${subscriptionId}`)
  revalidatePath(`/request/${subscriptionId}/response`)

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
      member_response_note:
        note || (decision === "accepted" ? "Accepted." : "Rejected."),
    })
    .eq("id", assignmentId)

  if (error) {
    return { error: `Unable to update PT assignment: ${error.message}` }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")
  revalidatePath("/request")
  revalidatePath(`/request/${subscriptionId}`)
  revalidatePath(`/request/${subscriptionId}/response`)

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

  const { data: subscription, error: subscriptionError } =
    await context.supabase
      .from("membership_subscriptions")
      .select("id,status")
      .eq("id", subscriptionId)
      .eq("member_id", context.memberId)
      .single()

  if (subscriptionError || !subscription) {
    return { error: "This subscription is not available." }
  }

  if (subscription.status !== "pending_payment") {
    return { error: "Vouchers can only be applied before payment." }
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
  const rawMethod = stringValue(formData, "method")
  const method = parseChoice(rawMethod, ["bank_transfer", "card"])

  if (rawMethod === "cash") {
    return { error: "Cash payments are recorded by the manager." }
  }

  if (!subscriptionId || !method) {
    return { error: "Choose a valid payment method." }
  }

  const context = await getMemberContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: subscription, error: subscriptionError } =
    await context.supabase
      .from("membership_subscriptions")
      .select("id,member_id,facility_id,status,final_price")
      .eq("id", subscriptionId)
      .eq("member_id", context.memberId)
      .single()

  if (subscriptionError || !subscription) {
    return { error: "This subscription is not available for payment." }
  }

  if (subscription.status !== "pending_payment") {
    return { error: "Only subscriptions waiting for payment can be paid." }
  }

  const paymentDetails = buildPaymentDetails(method, formData)

  if ("error" in paymentDetails) {
    return { error: paymentDetails.error }
  }

  const { data: activeSubscriptions, error: activeError } =
    await context.supabase
      .from("membership_subscriptions")
      .select("id")
      .eq("member_id", context.memberId)
      .eq("facility_id", subscription.facility_id)
      .eq("status", "active")
      .neq("id", subscriptionId)

  if (activeError) {
    return {
      error: `Unable to check current membership before payment: ${activeError.message}`,
    }
  }

  if (activeSubscriptions?.length) {
    try {
      createAdminClient()
    } catch (adminError) {
      return {
        error: friendlySubscriptionError(
          adminError instanceof Error ? adminError.message : String(adminError)
        ),
      }
    }
  }

  const { error } = await context.supabase.from("membership_payments").insert({
    subscription_id: subscriptionId,
    member_id: context.memberId,
    amount: subscription.final_price,
    method,
    ...paymentDetails.details,
    status: "paid",
  })

  if (error) {
    return {
      error: `Unable to complete payment: ${friendlySubscriptionError(error.message)}`,
    }
  }

  if (activeSubscriptions?.length) {
    try {
      const settlementError = await settleSingleActiveSubscription(
        subscriptionId,
        context.memberId
      )

      if (settlementError) {
        return {
          error: `Payment completed, but membership replacement needs attention: ${friendlySubscriptionError(settlementError.message)}`,
        }
      }
    } catch (settlementError) {
      return {
        error: `Payment completed, but membership replacement needs attention: ${friendlySubscriptionError(
          settlementError instanceof Error
            ? settlementError.message
            : String(settlementError)
        )}`,
      }
    }
  }

  revalidatePath(`/subscriptions/${subscriptionId}`)
  revalidatePath("/subscriptions")
  revalidatePath("/payments")

  return {}
}

export async function checkoutSubscription(
  state: MemberActionState,
  formData: FormData
): Promise<MemberActionState> {
  const intent = stringValue(formData, "intent")

  if (intent === "cancel") {
    const result = await cancelPendingSubscription(state, formData)
    return result.error ? result : { message: "Subscription cancelled" }
  }

  const result = await paySubscription(state, formData)
  return result.error ? result : { message: "Payment completed" }
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
