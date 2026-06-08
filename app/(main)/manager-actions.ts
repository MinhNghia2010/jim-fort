"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type ActionState = {
  error?: string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function intValue(value: string) {
  const parsed = Number(value)

  return Number.isInteger(parsed) ? parsed : null
}

const weeklySlotIndexes = [0, 1, 2, 3, 4, 5, 6]

async function getManagerContext() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as a manager to continue." }
  }

  if (!["manager", "owner"].includes(String(user.app_metadata.app_role))) {
    return { error: "Only managers can assign PT subscriptions." }
  }

  return { supabase, managerId: user.id }
}

export async function assignSubscriptionPt(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const subscriptionId = text(formData, "subscriptionId")
  const ptId = text(formData, "ptId")
  const startsOn = text(formData, "startsOn")
  const note = text(formData, "note")

  if (!subscriptionId || !ptId || !startsOn) {
    return { error: "Choose a subscription, PT, and schedule start date." }
  }

  const incompleteSlot = weeklySlotIndexes.some((index) => {
    const start = text(formData, `slotStart${index}`)
    const end = text(formData, `slotEnd${index}`)

    return Boolean(start) !== Boolean(end)
  })

  if (incompleteSlot) {
    return { error: "Choose both start and end time for each response day." }
  }

  const slots = weeklySlotIndexes
    .map((index) => {
      const day = intValue(text(formData, `slotDay${index}`))
      const start = text(formData, `slotStart${index}`)
      const end = text(formData, `slotEnd${index}`)

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
    return { error: "Add at least one weekly schedule slot." }
  }

  const context = await getManagerContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: existingPending, error: existingPendingError } =
    await context.supabase
      .from("membership_pt_assignments")
      .select("id")
      .eq("subscription_id", subscriptionId)
      .eq("status", "pending_member_decision")
      .maybeSingle()

  if (existingPendingError) {
    return {
      error: `Unable to check existing PT assignment: ${existingPendingError.message}`,
    }
  }

  if (existingPending) {
    return {
      error:
        "This request already has a pending PT assignment. Wait for the member to accept or reject it before sending another one.",
    }
  }

  const { data: assignment, error } = await context.supabase
    .from("membership_pt_assignments")
    .insert({
      subscription_id: subscriptionId,
      pt_id: ptId,
      assigned_by_manager_id: context.managerId,
      schedule_starts_on: startsOn,
      schedule_timezone: "Asia/Ho_Chi_Minh",
      schedule_note: note || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: `Unable to assign PT: ${error.message}` }
  }

  const { error: slotError } = await context.supabase
    .from("membership_pt_assignment_schedule_slots")
    .insert(slots.map((slot) => ({ ...slot, assignment_id: assignment.id })))

  if (slotError) {
    return { error: `Unable to save PT schedule: ${slotError.message}` }
  }

  revalidatePath("/request")
  revalidatePath(`/request/${subscriptionId}`)
  revalidatePath("/subscriptions")

  return {}
}
