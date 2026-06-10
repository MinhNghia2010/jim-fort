"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ActionState = {
  error?: string
}

const equipmentStatuses = [
  "active",
  "maintenance",
  "broken",
  "retired",
] as const

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function isEquipmentStatus(
  value: string
): value is (typeof equipmentStatuses)[number] {
  return equipmentStatuses.includes(value as (typeof equipmentStatuses)[number])
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function friendlyCreateMemberError(message: string) {
  if (message.includes("duplicate") || message.includes("already")) {
    return "An account with this email already exists."
  }

  if (message.includes("Password should be")) {
    return message
  }

  return message
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

  const role = String(user.app_metadata.app_role)

  if (!["manager", "owner"].includes(role)) {
    return { error: "Only managers or owners can use this action." }
  }

  return { supabase, managerId: user.id, role }
}

export async function respondFacilityFeedback(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const feedbackId = text(formData, "feedbackId")
  const response = text(formData, "managerResponse")

  if (!feedbackId || !response) {
    return { error: "Enter a response before sending." }
  }

  const context = await getManagerContext()

  if ("error" in context) {
    return { error: context.error }
  }

  if (context.role !== "manager") {
    return { error: "Only managers can respond to feedback." }
  }

  const { data, error } = await context.supabase
    .from("facility_feedbacks")
    .update({
      manager_response: response,
      responded_by_manager_id: context.managerId,
      responded_at: new Date().toISOString(),
      status: "responded",
    })
    .eq("id", feedbackId)
    .select("id")
    .maybeSingle()

  if (error) {
    return { error: `Unable to send response: ${error.message}` }
  }

  if (!data) {
    return { error: "This feedback is not available for your facility." }
  }

  revalidatePath("/feedback")
  revalidatePath(`/feedback/${feedbackId}`)

  return {}
}

export async function reportEquipmentIssue(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const equipmentId = text(formData, "equipmentId")
  const roomId = text(formData, "roomId")
  const facilityName = text(formData, "facilityName")
  const status = text(formData, "status")
  const issue = text(formData, "issue")

  if (!equipmentId) {
    return { error: "Select equipment to update." }
  }

  if (!isEquipmentStatus(status)) {
    return { error: "Select a valid equipment status." }
  }

  if (!issue) {
    return { error: "Enter the issue for the owner." }
  }

  const context = await getManagerContext()

  if ("error" in context) {
    return { error: context.error }
  }

  if (context.role !== "manager") {
    return { error: "Only managers can update equipment status." }
  }

  const { data, error } = await context.supabase.rpc("report_equipment_issue", {
    p_equipment_id: equipmentId,
    p_new_status: status,
    p_issue: issue,
  })

  if (error) {
    return { error: `Unable to update equipment: ${error.message}` }
  }

  if (!data) {
    return { error: "This equipment is not available for your facility." }
  }

  revalidatePath("/facility")

  if (facilityName) {
    revalidatePath(`/facility/${encodeURIComponent(facilityName)}`)
  }

  if (facilityName && roomId) {
    revalidatePath(
      `/facility/${encodeURIComponent(facilityName)}/rooms/${roomId}`
    )
    revalidatePath(
      `/facility/${encodeURIComponent(facilityName)}/rooms/${roomId}/equipments`
    )
    revalidatePath(
      `/facility/${encodeURIComponent(facilityName)}/rooms/${roomId}/equipments/${equipmentId}`
    )
  }

  return {}
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

  const { data: request, error: requestError } = await context.supabase
    .from("membership_subscriptions")
    .select("id,status,has_pt_snapshot")
    .eq("id", subscriptionId)
    .maybeSingle()

  if (requestError) {
    return {
      error: `Unable to load PT request: ${requestError.message}`,
    }
  }

  if (!request || !request.has_pt_snapshot) {
    return { error: "This PT subscription request is not available." }
  }

  if (request.status !== "pending_pt_setup") {
    return {
      error: "This PT request is not waiting for a manager response.",
    }
  }

  const { data: preference, error: preferenceError } = await context.supabase
    .from("membership_pt_preferences")
    .select("id")
    .eq("subscription_id", subscriptionId)
    .maybeSingle()

  if (preferenceError) {
    return {
      error: `Unable to check member preferences: ${preferenceError.message}`,
    }
  }

  if (!preference) {
    return {
      error:
        "The member needs to send PT preferences before you can respond with a trainer and schedule.",
    }
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
  revalidatePath(`/request/${subscriptionId}/response`)
  revalidatePath("/subscriptions")
  revalidatePath(`/subscriptions/${subscriptionId}`)

  return {}
}

export async function createManagedMember(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const fullName = text(formData, "fullName")
  const phone = text(formData, "phone")
  const email = normalizeEmail(text(formData, "email"))
  const password = String(formData.get("password") ?? "")
  const packageId = text(formData, "packageId")

  if (!fullName || !email || !password || !packageId) {
    return {
      error: "Enter a full name, email, password, and initial membership plan.",
    }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const context = await getManagerContext()

  if ("error" in context) {
    return { error: context.error }
  }

  const { data: selectedPackage, error: packageError } = await context.supabase
    .from("membership_packages")
    .select("id, name")
    .eq("id", packageId)
    .eq("status", "active")
    .maybeSingle()

  if (packageError) {
    return {
      error: `Unable to verify membership plan: ${packageError.message}`,
    }
  }

  if (!selectedPackage) {
    return {
      error:
        "Choose an active membership plan from one of your managed facilities.",
    }
  }

  const admin = createAdminClient()
  const { data: existingAccount, error: existingAccountError } = await admin
    .from("accounts")
    .select("id")
    .eq("email", email)
    .maybeSingle()

  if (existingAccountError) {
    return {
      error: `Unable to check existing login account: ${existingAccountError.message}`,
    }
  }

  if (existingAccount) {
    return { error: "An account with this email already exists." }
  }

  const { data: authResult, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        app_role: "member",
      },
      user_metadata: {
        full_name: fullName,
        phone,
        role: "member",
      },
    })

  if (authError || !authResult.user) {
    return {
      error: `Unable to create login account: ${friendlyCreateMemberError(
        authError?.message ?? "No auth user was returned."
      )}`,
    }
  }

  const memberId = authResult.user.id
  let accountId: string | null = null

  const cleanupAuthUser = async () => {
    await admin.auth.admin.deleteUser(memberId)
  }

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .insert({
      email,
      password_hash: `supabase-auth:${memberId}`,
      status: "active",
    })
    .select("id")
    .single()

  if (accountError || !account) {
    await cleanupAuthUser()

    return {
      error: `Login account was created, but app account setup failed: ${
        accountError?.message ?? "No account row was returned."
      }`,
    }
  }

  accountId = String(account.id)

  const { error: userError } = await admin.from("users").insert({
    id: memberId,
    account_id: accountId,
    full_name: fullName,
    phone: phone || null,
    role: "member",
  })

  if (userError) {
    await admin.from("accounts").delete().eq("id", accountId)
    await cleanupAuthUser()

    return {
      error: `App profile setup failed: ${friendlyCreateMemberError(
        userError.message
      )}`,
    }
  }

  const { error: subscriptionError } = await admin
    .from("membership_subscriptions")
    .insert({
      member_id: memberId,
      package_id: packageId,
    })

  if (subscriptionError) {
    await admin.from("users").delete().eq("id", memberId)
    await admin.from("accounts").delete().eq("id", accountId)
    await cleanupAuthUser()

    return {
      error: `Member account was created, but subscription setup failed: ${subscriptionError.message}`,
    }
  }

  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  revalidatePath("/overview")

  redirect(`/members/${memberId}`)
}
