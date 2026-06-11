"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type {
  MembershipFormState,
  MembershipPlanKind,
  MembershipStatus,
} from "@/lib/features/owner/memberships/form/types"
import type { DeleteActionState } from "@/components/DeleteConfirmationDialog"
import { createAdminClient } from "@/lib/supabase/admin"
import { withRedirectToast } from "@/lib/redirect-toast"
import { createClient } from "@/lib/supabase/server"

type MembershipPackagePayload = {
  facility_id: string
  name: string
  description: string | null
  price: number
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  status: MembershipStatus
  release_date: string | null
  end_date: string | null
}

async function getOwnerClient() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as an owner to manage membership plans." }
  }

  if (user.app_metadata.app_role !== "owner") {
    return { error: "Only owners can create or edit membership plans." }
  }

  return { supabase }
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function uniqueValues(values: FormDataEntryValue[]) {
  return [...new Set(values.map(String).map((value) => value.trim()))].filter(
    Boolean
  )
}

function parseStatus(value: string): MembershipStatus | null {
  if (value === "active" || value === "inactive" || value === "archived") {
    return value
  }

  return null
}

function parsePlanKind(value: string): MembershipPlanKind | null {
  if (value === "access" || value === "pt") {
    return value
  }

  return null
}

function parsePositiveInteger(value: string) {
  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseOptionalDate(
  value: string,
  label: string
): { value: string | null } | { error: string } {
  if (!value) {
    return { value: null }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: `Enter a valid ${label}.` }
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return { error: `Enter a valid ${label}.` }
  }

  return { value }
}

function parseMembershipPackagePayload(
  formData: FormData
): MembershipPackagePayload | { error: string } {
  const facilityId = stringValue(formData, "facilityId")
  const name = stringValue(formData, "name")
  const description = stringValue(formData, "description")
  const price = Number(stringValue(formData, "price"))
  const status = parseStatus(stringValue(formData, "status"))
  const planKind = parsePlanKind(stringValue(formData, "planKind"))
  const releaseDate = parseOptionalDate(
    stringValue(formData, "releaseDate"),
    "release date"
  )
  const endDate = parseOptionalDate(
    stringValue(formData, "endDate"),
    "end date"
  )

  if (!facilityId) {
    return { error: "Select a facility for this membership plan." }
  }

  if (!name) {
    return { error: "Enter a membership plan name." }
  }

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid non-negative price." }
  }

  if (!status) {
    return { error: "Select a valid plan status." }
  }

  if (!planKind) {
    return { error: "Select a valid package type." }
  }

  if ("error" in releaseDate) {
    return { error: releaseDate.error }
  }

  if ("error" in endDate) {
    return { error: endDate.error }
  }

  if (releaseDate.value && endDate.value && releaseDate.value > endDate.value) {
    return { error: "End date must be on or after the release date." }
  }

  if (planKind === "pt") {
    const sessionCount = parsePositiveInteger(
      stringValue(formData, "sessionCount")
    )

    if (!sessionCount) {
      return { error: "Enter a positive PT session count." }
    }

    return {
      facility_id: facilityId,
      name,
      description: description || null,
      price,
      has_pt: true,
      duration_days: null,
      session_count: sessionCount,
      status,
      release_date: releaseDate.value,
      end_date: endDate.value,
    }
  }

  const durationDays = parsePositiveInteger(
    stringValue(formData, "durationDays")
  )

  if (!durationDays) {
    return { error: "Enter a positive duration in days." }
  }

  return {
    facility_id: facilityId,
    name,
    description: description || null,
    price,
    has_pt: false,
    duration_days: durationDays,
    session_count: null,
    status,
    release_date: releaseDate.value,
    end_date: endDate.value,
  }
}

async function replacePackageRooms(
  packageId: string,
  roomIds: readonly string[]
) {
  const supabase = await createClient()
  const deleteResult = await supabase
    .from("membership_package_rooms")
    .delete()
    .eq("package_id", packageId)

  if (deleteResult.error) {
    return deleteResult.error.message
  }

  if (!roomIds.length) {
    return null
  }

  const insertResult = await supabase.from("membership_package_rooms").insert(
    roomIds.map((roomId) => ({
      package_id: packageId,
      room_id: roomId,
    }))
  )

  return insertResult.error?.message ?? null
}

export async function createMembershipPackage(
  _state: MembershipFormState,
  formData: FormData
): Promise<MembershipFormState> {
  const payload = parseMembershipPackagePayload(formData)

  if ("error" in payload) {
    return { error: payload.error }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const roomIds = uniqueValues(formData.getAll("roomIds"))
  const supabase = ownerClient.supabase
  const { data, error } = await supabase
    .from("membership_packages")
    .insert(payload)
    .select("id")
    .single()

  if (error) {
    return { error: `Unable to create membership plan: ${error.message}` }
  }

  const roomError = await replacePackageRooms(data.id, roomIds)

  if (roomError) {
    return {
      error: `Membership plan was created, but room access failed: ${roomError}`,
    }
  }

  revalidatePath("/memberships")
  redirect(
    withRedirectToast(
      "/memberships",
      `${payload.name} membership plan was created.`
    )
  )
}

export async function updateMembershipPackage(
  _state: MembershipFormState,
  formData: FormData
): Promise<MembershipFormState> {
  const packageId = stringValue(formData, "id")

  if (!packageId) {
    return { error: "Select a membership plan to edit." }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const supabase = ownerClient.supabase

  if (stringValue(formData, "_intent") === "archive") {
    const { error } = await supabase
      .from("membership_packages")
      .update({ status: "archived" })
      .eq("id", packageId)

    if (error) {
      return { error: `Unable to archive membership plan: ${error.message}` }
    }

    revalidatePath("/memberships")
    redirect(
      withRedirectToast("/memberships", "Membership plan was archived.")
    )
  }

  const payload = parseMembershipPackagePayload(formData)

  if ("error" in payload) {
    return { error: payload.error }
  }

  const roomIds = uniqueValues(formData.getAll("roomIds"))
  const { error } = await supabase
    .from("membership_packages")
    .update(payload)
    .eq("id", packageId)

  if (error) {
    return { error: `Unable to update membership plan: ${error.message}` }
  }

  const roomError = await replacePackageRooms(packageId, roomIds)

  if (roomError) {
    return {
      error: `Membership plan was updated, but room access failed: ${roomError}`,
    }
  }

  revalidatePath("/memberships")
  redirect(
    withRedirectToast(
      "/memberships",
      `${payload.name} membership plan was updated.`
    )
  )
}

export async function deleteMembershipPackage(
  _state: DeleteActionState,
  formData: FormData
): Promise<DeleteActionState> {
  const packageId = stringValue(formData, "packageId")

  if (!packageId) {
    return { error: "Select a membership plan to delete." }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const { data: accessiblePackage, error: accessError } =
    await ownerClient.supabase
      .from("membership_packages")
      .select("id, name")
      .eq("id", packageId)
      .maybeSingle()

  if (accessError) {
    return {
      error: `Unable to verify membership plan access: ${accessError.message}`,
    }
  }

  if (!accessiblePackage) {
    return { error: "This membership plan is not available to delete." }
  }

  const admin = createAdminClient()
  const { count, error: subscriptionError } = await admin
    .from("membership_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("package_id", packageId)

  if (subscriptionError) {
    return {
      error: `Unable to check membership history: ${subscriptionError.message}`,
    }
  }

  if ((count ?? 0) > 0) {
    return {
      error:
        "This plan has subscription history and cannot be deleted. Archive it instead.",
    }
  }

  const { data: deletedPackage, error: deleteError } = await admin
    .from("membership_packages")
    .delete()
    .eq("id", packageId)
    .select("id")
    .maybeSingle()

  if (deleteError) {
    return {
      error: `Unable to delete membership plan: ${deleteError.message}`,
    }
  }

  if (!deletedPackage) {
    return { error: "The membership plan was not deleted." }
  }

  revalidatePath("/memberships")
  revalidatePath("/overview")

  return { message: `${accessiblePackage.name} was deleted.` }
}
