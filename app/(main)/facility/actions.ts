"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  getEquipmentHref,
  getFacilityHref,
  getRoomEquipmentHref,
  getRoomHref,
  type RoomStatus,
} from "@/app/(main)/facility/data"
import type { RoomEquipmentStatus } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { withRedirectToast } from "@/lib/redirect-toast"
import { createClient } from "@/lib/supabase/server"

export type FacilityCreateFormState = {
  error?: string
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

type OwnedFacility = {
  id: string
  name: string
}

type OwnedRoom = {
  id: string
  facility_id: string
  name: string
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function optionalString(formData: FormData, key: string) {
  return stringValue(formData, key) || null
}

function validateLength(value: string, label: string, maxLength: number) {
  if (value.length > maxLength) {
    return `${label} must be ${maxLength} characters or fewer.`
  }

  return null
}

function parseRoomStatus(value: string): RoomStatus | null {
  if (value === "active" || value === "maintenance" || value === "closed") {
    return value
  }

  return null
}

function parseEquipmentStatus(value: string): RoomEquipmentStatus | null {
  if (
    value === "active" ||
    value === "maintenance" ||
    value === "broken" ||
    value === "retired"
  ) {
    return value
  }

  return null
}

function parseOptionalDate(value: string) {
  if (!value) {
    return { value: null }
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { error: "Enter a valid purchase date." }
  }

  const parsed = new Date(`${value}T00:00:00.000Z`)

  if (
    Number.isNaN(parsed.valueOf()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    return { error: "Enter a valid purchase date." }
  }

  return { value }
}

function parseOptionalPrice(value: string) {
  if (!value) {
    return { value: null }
  }

  const price = Number(value)

  if (!Number.isFinite(price) || price < 0) {
    return { error: "Enter a valid non-negative purchase price." }
  }

  return { value: price }
}

async function getOwnerClient() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as an owner to manage facility records." }
  }

  if (user.app_metadata.app_role !== "owner") {
    return { error: "Only owners can create rooms and equipment." }
  }

  return { supabase, userId: user.id }
}

async function getOwnedFacility(
  supabase: SupabaseClient,
  userId: string,
  facilityId: string
) {
  const result = await supabase
    .from("gym_facilities")
    .select("id, name")
    .eq("id", facilityId)
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle()

  return {
    facility: result.data as OwnedFacility | null,
    error: result.error,
  }
}

async function getOwnedRoom(
  supabase: SupabaseClient,
  facilityId: string,
  roomId: string
) {
  const result = await supabase
    .from("rooms")
    .select("id, facility_id, name")
    .eq("id", roomId)
    .eq("facility_id", facilityId)
    .limit(1)
    .maybeSingle()

  return {
    room: result.data as OwnedRoom | null,
    error: result.error,
  }
}

export async function createFacilityRoom(
  _state: FacilityCreateFormState,
  formData: FormData
): Promise<FacilityCreateFormState> {
  const facilityId = stringValue(formData, "facilityId")
  const name = stringValue(formData, "name")
  const description = optionalString(formData, "description")
  const status = parseRoomStatus(stringValue(formData, "status"))

  if (!facilityId) {
    return { error: "Select a facility before adding a room." }
  }

  if (!name) {
    return { error: "Enter a room name." }
  }

  const nameLengthError = validateLength(name, "Room name", 120)
  const descriptionLengthError = description
    ? validateLength(description, "Room description", 1000)
    : null

  if (nameLengthError || descriptionLengthError) {
    return { error: nameLengthError ?? descriptionLengthError ?? undefined }
  }

  if (!status) {
    return { error: "Select a valid room status." }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const { supabase, userId } = ownerClient
  const facilityResult = await getOwnedFacility(supabase, userId, facilityId)

  if (facilityResult.error) {
    return {
      error: `Unable to verify the facility: ${facilityResult.error.message}`,
    }
  }

  if (!facilityResult.facility) {
    return { error: "The selected facility is not owned by this account." }
  }

  const duplicateResult = await supabase
    .from("rooms")
    .select("id")
    .eq("facility_id", facilityId)
    .ilike("name", name)
    .limit(1)
    .maybeSingle()

  if (duplicateResult.error) {
    return {
      error: `Unable to check the room name: ${duplicateResult.error.message}`,
    }
  }

  if (duplicateResult.data) {
    return { error: "A room with this name already exists in the facility." }
  }

  const insertResult = await supabase
    .from("rooms")
    .insert({
      facility_id: facilityId,
      name,
      description,
      status,
    })
    .select("id")
    .single()

  if (insertResult.error) {
    return { error: `Unable to create room: ${insertResult.error.message}` }
  }

  const facilityHref = getFacilityHref(facilityResult.facility.name)
  const roomHref = getRoomHref(
    facilityResult.facility.name,
    insertResult.data.id
  )

  revalidatePath("/facility")
  revalidatePath(facilityHref)
  redirect(withRedirectToast(roomHref, `${name} was created.`))
}

export async function createRoomEquipment(
  _state: FacilityCreateFormState,
  formData: FormData
): Promise<FacilityCreateFormState> {
  const facilityId = stringValue(formData, "facilityId")
  const roomId = stringValue(formData, "roomId")
  const name = stringValue(formData, "name")
  const category = optionalString(formData, "category")
  const equipmentCode = stringValue(formData, "equipmentCode").toUpperCase()
  const serialNumber = optionalString(formData, "serialNumber")
  const brand = optionalString(formData, "brand")
  const model = optionalString(formData, "model")
  const description = optionalString(formData, "description")
  const purchaseDate = parseOptionalDate(
    stringValue(formData, "purchaseDate")
  )
  const purchasePrice = parseOptionalPrice(
    stringValue(formData, "purchasePrice")
  )
  const status = parseEquipmentStatus(stringValue(formData, "status"))
  const note = optionalString(formData, "note")

  if (!facilityId || !roomId) {
    return { error: "Select a facility room before adding equipment." }
  }

  if (!name) {
    return { error: "Enter an equipment name." }
  }

  if (!equipmentCode) {
    return { error: "Enter an equipment code." }
  }

  if (!/^[A-Z0-9][A-Z0-9_-]*$/.test(equipmentCode)) {
    return {
      error:
        "Equipment codes can only use letters, numbers, underscores, or hyphens.",
    }
  }

  const lengthError = [
    validateLength(name, "Equipment name", 120),
    category ? validateLength(category, "Category", 80) : null,
    validateLength(equipmentCode, "Equipment code", 64),
    serialNumber ? validateLength(serialNumber, "Serial number", 120) : null,
    brand ? validateLength(brand, "Brand", 100) : null,
    model ? validateLength(model, "Model", 100) : null,
    description
      ? validateLength(description, "Equipment description", 1000)
      : null,
    note ? validateLength(note, "Equipment note", 1000) : null,
  ].find(Boolean)

  if (lengthError) {
    return { error: lengthError }
  }

  if ("error" in purchaseDate) {
    return { error: purchaseDate.error }
  }

  if ("error" in purchasePrice) {
    return { error: purchasePrice.error }
  }

  if (!status) {
    return { error: "Select a valid equipment status." }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const { supabase, userId } = ownerClient
  const facilityResult = await getOwnedFacility(supabase, userId, facilityId)

  if (facilityResult.error) {
    return {
      error: `Unable to verify the facility: ${facilityResult.error.message}`,
    }
  }

  if (!facilityResult.facility) {
    return { error: "The selected facility is not owned by this account." }
  }

  const roomResult = await getOwnedRoom(supabase, facilityId, roomId)

  if (roomResult.error) {
    return { error: `Unable to verify the room: ${roomResult.error.message}` }
  }

  if (!roomResult.room) {
    return { error: "The selected room does not belong to this facility." }
  }

  const duplicateResult = await supabase
    .from("gym_equipments")
    .select("id")
    .eq("facility_id", facilityId)
    .eq("equipment_code", equipmentCode)
    .limit(1)
    .maybeSingle()

  if (duplicateResult.error) {
    return {
      error: `Unable to check the equipment code: ${duplicateResult.error.message}`,
    }
  }

  if (duplicateResult.data) {
    return {
      error: "This equipment code is already used in the selected facility.",
    }
  }

  const insertResult = await supabase
    .from("gym_equipments")
    .insert({
      facility_id: facilityId,
      room_id: roomId,
      name,
      category,
      equipment_code: equipmentCode,
      serial_number: serialNumber,
      brand,
      model,
      description,
      purchase_date: purchaseDate.value,
      purchase_price: purchasePrice.value,
      status,
      note,
    })
    .select("id")
    .single()

  if (insertResult.error) {
    return {
      error: `Unable to create equipment: ${insertResult.error.message}`,
    }
  }

  const facilityName = facilityResult.facility.name
  const facilityHref = getFacilityHref(facilityName)
  const roomHref = getRoomHref(facilityName, roomId)
  const equipmentListHref = getRoomEquipmentHref(facilityName, roomId)
  const equipmentHref = getEquipmentHref(
    facilityName,
    roomId,
    insertResult.data.id
  )

  revalidatePath("/facility")
  revalidatePath(facilityHref)
  revalidatePath(roomHref)
  revalidatePath(equipmentListHref)
  redirect(withRedirectToast(equipmentHref, `${name} was created.`))
}
