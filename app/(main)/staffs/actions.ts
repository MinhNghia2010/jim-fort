"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { DeleteActionState } from "@/components/DeleteConfirmationDialog"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ActionState = {
  error?: string
}

const staffStatuses = ["active", "inactive", "on_leave", "terminated"] as const
const loginUserRoles = ["manager", "pt"] as const
const staffCreateKinds = ["staff_row", "manager", "pt"] as const

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function nullableText(value: string) {
  return value ? value : null
}

function isStaffStatus(value: string): value is (typeof staffStatuses)[number] {
  return staffStatuses.includes(value as (typeof staffStatuses)[number])
}

function isLoginUserRole(value: string): value is (typeof loginUserRoles)[number] {
  return loginUserRoles.includes(value as (typeof loginUserRoles)[number])
}

function isStaffCreateKind(
  value: string
): value is (typeof staffCreateKinds)[number] {
  return staffCreateKinds.includes(value as (typeof staffCreateKinds)[number])
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function normalizeDate(value: string) {
  if (!value) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  return Number.isNaN(date.valueOf()) ? undefined : value
}

function friendlyAuthError(message: string) {
  if (message.includes("duplicate") || message.includes("already")) {
    return "An account with this email already exists."
  }

  if (message.includes("Password should be")) {
    return message
  }

  return message
}

async function getStaffActionContext(actionName: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: `Sign in to ${actionName} staff.` }
  }

  const appRole = String(user.app_metadata.app_role)

  if (!["owner", "manager"].includes(appRole)) {
    return { error: "Only owners or managers can manage staff." }
  }

  return { supabase, userId: user.id, appRole }
}

async function verifyAccessibleFacility(
  supabase: Awaited<ReturnType<typeof createClient>>,
  facilityId: string
) {
  const { data, error } = await supabase
    .from("gym_facilities")
    .select("id")
    .eq("id", facilityId)
    .maybeSingle()

  if (error) {
    return { error: `Unable to verify facility access: ${error.message}` }
  }

  if (!data) {
    return { error: "This facility is not available for your workspace." }
  }

  return {}
}

export async function createStaff(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staffKindValue = text(formData, "staffKind") || "staff_row"
  const facilityId = text(formData, "facilityId")
  const fullName = text(formData, "fullName")
  const phone = text(formData, "phone")
  const role = text(formData, "role")
  const status = text(formData, "status") || "active"
  const hiredAt = normalizeDate(text(formData, "hiredAt"))
  const note = text(formData, "note")
  const email = normalizeEmail(text(formData, "email"))
  const password = String(formData.get("password") ?? "")

  if (!isStaffCreateKind(staffKindValue)) {
    return { error: "Select a valid staff type." }
  }

  if (!facilityId) {
    return { error: "Select a facility." }
  }

  if (!fullName) {
    return { error: "Enter the staff full name." }
  }

  if (hiredAt === undefined) {
    return { error: "Enter a valid hired date." }
  }

  const context = await getStaffActionContext("create")

  if ("error" in context) {
    return { error: context.error }
  }

  if (context.appRole === "manager" && staffKindValue !== "staff_row") {
    return { error: "Managers can only create staff directory records." }
  }

  const facilityAccess = await verifyAccessibleFacility(
    context.supabase,
    facilityId
  )

  if ("error" in facilityAccess) {
    return { error: facilityAccess.error }
  }

  if (staffKindValue === "staff_row") {
    if (!role) {
      return { error: "Enter the staff role." }
    }

    if (!isStaffStatus(status)) {
      return { error: "Select a valid staff status." }
    }

    const admin = createAdminClient()
    const { data, error } = await admin
      .from("staffs")
      .insert({
        facility_id: facilityId,
        full_name: fullName,
        phone: nullableText(phone),
        role,
        status,
        hired_at: hiredAt,
        note: nullableText(note),
      })
      .select("id")
      .single()

    if (error || !data) {
      return {
        error: `Unable to create staff: ${
          error?.message ?? "No staff row was returned."
        }`,
      }
    }

    revalidatePath("/staffs")
    revalidatePath("/overview")

    redirect(`/staffs/${data.id}`)
  }

  if (context.appRole !== "owner") {
    return { error: "Only owners can create manager or PT login accounts." }
  }

  if (!email || !password) {
    return { error: "Enter an email and temporary password for this account." }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." }
  }

  const loginRole = staffKindValue
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
        app_role: loginRole,
      },
      user_metadata: {
        full_name: fullName,
        phone,
        role: loginRole,
      },
    })

  if (authError || !authResult.user) {
    return {
      error: `Unable to create login account: ${friendlyAuthError(
        authError?.message ?? "No auth user was returned."
      )}`,
    }
  }

  const staffUserId = authResult.user.id
  let accountId: string | null = null

  const cleanupCreatedLogin = async () => {
    await admin.from("facility_managers").delete().eq("manager_id", staffUserId)
    await admin.from("facility_pts").delete().eq("pt_id", staffUserId)
    await admin.from("users").delete().eq("id", staffUserId)

    if (accountId) {
      await admin.from("accounts").delete().eq("id", accountId)
    }

    await admin.auth.admin.deleteUser(staffUserId)
  }

  const { data: account, error: accountError } = await admin
    .from("accounts")
    .insert({
      email,
      password_hash: `supabase-auth:${staffUserId}`,
      status: "active",
    })
    .select("id")
    .single()

  if (accountError || !account) {
    await cleanupCreatedLogin()

    return {
      error: `Login account was created, but app account setup failed: ${
        accountError?.message ?? "No account row was returned."
      }`,
    }
  }

  accountId = String(account.id)

  const { error: userError } = await admin.from("users").insert({
    id: staffUserId,
    account_id: accountId,
    full_name: fullName,
    phone: nullableText(phone),
    role: loginRole,
  })

  if (userError) {
    await cleanupCreatedLogin()

    return {
      error: `Login account was created, but profile setup failed: ${userError.message}`,
    }
  }

  const assignment =
    loginRole === "manager"
      ? await admin.from("facility_managers").insert({
          facility_id: facilityId,
          manager_id: staffUserId,
        })
      : await admin.from("facility_pts").insert({
          facility_id: facilityId,
          pt_id: staffUserId,
          assigned_by_manager_id: context.userId,
        })

  if (assignment.error) {
    await cleanupCreatedLogin()

    return {
      error: `Login account was created, but facility assignment failed: ${assignment.error.message}`,
    }
  }

  revalidatePath("/staffs")
  revalidatePath("/overview")

  redirect(`/staffs/${staffUserId}`)
}

export async function updateStaff(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staffId = text(formData, "staffId")
  const staffKind = text(formData, "staffKind") || "staff_row"
  const fullName = text(formData, "fullName")
  const phone = text(formData, "phone")
  const role = text(formData, "role")
  const status = text(formData, "status")
  const hiredAt = normalizeDate(text(formData, "hiredAt"))
  const note = text(formData, "note")

  if (!staffId) {
    return { error: "Select a staff record to update." }
  }

  if (!fullName) {
    return { error: "Enter the staff full name." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Sign in to update staff." }
  }

  const appRole = String(user.app_metadata.app_role)

  if (!["owner", "manager"].includes(appRole)) {
    return { error: "Only owners or managers can update staff." }
  }

  if (staffKind === "login_user") {
    if (appRole !== "owner") {
      return { error: "Only owners can update manager or PT login profiles." }
    }

    const { data: loginUser, error: loginUserError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", staffId)
      .maybeSingle()

    if (loginUserError) {
      return {
        error: `Unable to verify staff login user: ${loginUserError.message}`,
      }
    }

    const loginRole = String(loginUser?.role ?? "")

    if (!loginUser || !isLoginUserRole(loginRole)) {
      return { error: "This staff login user is not available to edit." }
    }

    const assignmentTable =
      loginRole === "manager" ? "facility_managers" : "facility_pts"
    const assignmentColumn = loginRole === "manager" ? "manager_id" : "pt_id"
    const { data: accessibleAssignment, error: assignmentError } =
      await supabase
        .from(assignmentTable)
        .select(assignmentColumn)
        .eq(assignmentColumn, staffId)
        .limit(1)
        .maybeSingle()

    if (assignmentError) {
      return {
        error: `Unable to verify staff facility access: ${assignmentError.message}`,
      }
    }

    if (!accessibleAssignment) {
      return {
        error: "This staff login user is not available for your workspace.",
      }
    }

    const admin = createAdminClient()
    const { data: updatedUser, error: updateError } = await admin
      .from("users")
      .update({
        full_name: fullName,
        phone: nullableText(phone),
        updated_at: new Date().toISOString(),
      })
      .eq("id", staffId)
      .select("id")
      .maybeSingle()

    if (updateError) {
      return { error: `Unable to update staff login user: ${updateError.message}` }
    }

    if (!updatedUser) {
      return { error: "Staff login user update did not return a record." }
    }

    revalidatePath("/staffs")
    revalidatePath(`/staffs/${staffId}`)
    revalidatePath(`/staffs/${staffId}/edit`)
    revalidatePath("/overview")

    redirect(`/staffs/${staffId}`)
  }

  if (staffKind !== "staff_row") {
    return { error: "Select a valid staff record type." }
  }

  if (!isStaffStatus(status)) {
    return { error: "Select a valid staff status." }
  }

  if (hiredAt === undefined) {
    return { error: "Enter a valid hired date." }
  }

  const { data: accessibleStaff, error: accessError } = await supabase
    .from("staffs")
    .select("id")
    .eq("id", staffId)
    .maybeSingle()

  if (accessError) {
    return { error: `Unable to verify staff access: ${accessError.message}` }
  }

  if (!accessibleStaff) {
    return { error: "This staff row is not available for your workspace." }
  }

  const admin = createAdminClient()
  const { data: updatedStaff, error: updateError } = await admin
    .from("staffs")
    .update({
      full_name: fullName,
      phone: nullableText(phone),
      role: nullableText(role),
      status,
      hired_at: hiredAt,
      note: nullableText(note),
      updated_at: new Date().toISOString(),
    })
    .eq("id", staffId)
    .select("id")
    .maybeSingle()

  if (updateError) {
    return { error: `Unable to update staff: ${updateError.message}` }
  }

  if (!updatedStaff) {
    return { error: "Staff update did not return a record." }
  }

  revalidatePath("/staffs")
  revalidatePath(`/staffs/${staffId}`)
  revalidatePath(`/staffs/${staffId}/edit`)
  revalidatePath("/overview")

  redirect(`/staffs/${staffId}`)
}

export async function deleteStaff(
  _state: DeleteActionState,
  formData: FormData
): Promise<DeleteActionState> {
  const staffId = text(formData, "staffId")

  if (!staffId) {
    return { error: "Select a staff record to delete." }
  }

  const context = await getStaffActionContext("delete")

  if ("error" in context) {
    return { error: context.error }
  }

  if (context.appRole !== "owner") {
    return { error: "Only owners can delete staff records and login accounts." }
  }

  const admin = createAdminClient()
  const { data: staffRow, error: staffError } = await admin
    .from("staffs")
    .select("id, facility_id, full_name")
    .eq("id", staffId)
    .maybeSingle()

  if (staffError) {
    return { error: `Unable to verify staff record: ${staffError.message}` }
  }

  if (staffRow) {
    const { data: facility, error: facilityError } = await admin
      .from("gym_facilities")
      .select("id")
      .eq("id", staffRow.facility_id)
      .eq("owner_id", context.userId)
      .maybeSingle()

    if (facilityError) {
      return {
        error: `Unable to verify staff facility: ${facilityError.message}`,
      }
    }

    if (!facility) {
      return { error: "This staff record is not available to delete." }
    }

    const { data: deletedStaff, error: deleteError } = await admin
      .from("staffs")
      .delete()
      .eq("id", staffId)
      .select("id")
      .maybeSingle()

    if (deleteError) {
      return { error: `Unable to delete staff: ${deleteError.message}` }
    }

    if (!deletedStaff) {
      return { error: "The staff record was not deleted." }
    }

    revalidatePath("/staffs")
    revalidatePath(`/staffs/${staffId}`)
    revalidatePath("/overview")

    return { message: `${staffRow.full_name} was deleted.` }
  }

  const { data: loginUser, error: loginUserError } = await admin
    .from("users")
    .select("id, account_id, full_name, role")
    .eq("id", staffId)
    .maybeSingle()

  if (loginUserError) {
    return {
      error: `Unable to verify staff login account: ${loginUserError.message}`,
    }
  }

  const loginRole = String(loginUser?.role ?? "")

  if (!loginUser || !isLoginUserRole(loginRole)) {
    return { error: "This staff login account is not available to delete." }
  }

  const assignmentTable =
    loginRole === "manager" ? "facility_managers" : "facility_pts"
  const assignmentColumn = loginRole === "manager" ? "manager_id" : "pt_id"
  const { data: assignments, error: assignmentError } = await admin
    .from(assignmentTable)
    .select("facility_id")
    .eq(assignmentColumn, staffId)

  if (assignmentError) {
    return {
      error: `Unable to verify staff assignments: ${assignmentError.message}`,
    }
  }

  const facilityIds = (assignments ?? []).map(
    (assignment) => assignment.facility_id
  )
  const { data: ownedFacilities, error: ownedFacilitiesError } = facilityIds.length
    ? await admin
        .from("gym_facilities")
        .select("id")
        .in("id", facilityIds)
        .eq("owner_id", context.userId)
    : { data: [], error: null }

  if (ownedFacilitiesError) {
    return {
      error: `Unable to verify facility ownership: ${ownedFacilitiesError.message}`,
    }
  }

  if (
    !facilityIds.length ||
    ownedFacilities.length !== new Set(facilityIds).size
  ) {
    return {
      error:
        "This staff login account has assignments outside your owned facilities.",
    }
  }

  if (loginRole === "pt") {
    const [assignmentHistory, sessionHistory, feedbackHistory] =
      await Promise.all([
        admin
          .from("membership_pt_assignments")
          .select("id", { count: "exact", head: true })
          .eq("pt_id", staffId),
        admin
          .from("membership_pt_sessions")
          .select("id", { count: "exact", head: true })
          .eq("pt_id", staffId),
        admin
          .from("pt_session_feedbacks")
          .select("id", { count: "exact", head: true })
          .eq("pt_id", staffId),
      ])
    const historyError =
      assignmentHistory.error ??
      sessionHistory.error ??
      feedbackHistory.error

    if (historyError) {
      return {
        error: `Unable to check PT history: ${historyError.message}`,
      }
    }

    if (
      (assignmentHistory.count ?? 0) > 0 ||
      (sessionHistory.count ?? 0) > 0 ||
      (feedbackHistory.count ?? 0) > 0
    ) {
      return {
        error:
          "This PT has assignment or session history and cannot be deleted. Set the account inactive instead.",
      }
    }
  } else {
    const { count, error } = await admin
      .from("facility_feedbacks")
      .select("id", { count: "exact", head: true })
      .eq("responded_by_manager_id", staffId)

    if (error) {
      return {
        error: `Unable to check manager response history: ${error.message}`,
      }
    }

    if ((count ?? 0) > 0) {
      return {
        error:
          "This manager has feedback response history and cannot be deleted. Reassign or retain the account.",
      }
    }
  }

  const { error: assignmentDeleteError } = await admin
    .from(assignmentTable)
    .delete()
    .eq(assignmentColumn, staffId)

  if (assignmentDeleteError) {
    return {
      error: `Unable to remove staff assignments: ${assignmentDeleteError.message}`,
    }
  }

  const { data: deletedUser, error: userDeleteError } = await admin
    .from("users")
    .delete()
    .eq("id", staffId)
    .select("id")
    .maybeSingle()

  if (userDeleteError) {
    return {
      error: `Unable to delete staff login profile: ${userDeleteError.message}`,
    }
  }

  if (!deletedUser) {
    return { error: "The staff login profile was not deleted." }
  }

  const cleanupErrors: string[] = []

  if (loginUser.account_id) {
    const { error: accountDeleteError } = await admin
      .from("accounts")
      .delete()
      .eq("id", loginUser.account_id)

    if (accountDeleteError) {
      cleanupErrors.push(`app account: ${accountDeleteError.message}`)
    }
  }

  const { error: authDeleteError } =
    await admin.auth.admin.deleteUser(staffId)

  if (authDeleteError) {
    cleanupErrors.push(`login account: ${authDeleteError.message}`)
  }

  revalidatePath("/staffs")
  revalidatePath(`/staffs/${staffId}`)
  revalidatePath("/overview")

  if (cleanupErrors.length) {
    return {
      error: `Staff records were deleted, but cleanup failed for ${cleanupErrors.join("; ")}.`,
    }
  }

  return { message: `${loginUser.full_name} was deleted.` }
}
