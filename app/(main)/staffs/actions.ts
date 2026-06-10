"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ActionState = {
  error?: string
}

const staffStatuses = ["active", "inactive", "on_leave", "terminated"] as const

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function nullableText(value: string) {
  return value ? value : null
}

function isStaffStatus(value: string): value is (typeof staffStatuses)[number] {
  return staffStatuses.includes(value as (typeof staffStatuses)[number])
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

export async function updateStaff(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const staffId = text(formData, "staffId")
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

  if (!isStaffStatus(status)) {
    return { error: "Select a valid staff status." }
  }

  if (hiredAt === undefined) {
    return { error: "Enter a valid hired date." }
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
