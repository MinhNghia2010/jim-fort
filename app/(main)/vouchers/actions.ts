"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type {
  VoucherDiscountType,
  VoucherFormState,
  VoucherStatus,
} from "@/components/screens/owner/vouchers/form/types"
import { createClient } from "@/lib/supabase/server"

type VoucherPayload = {
  facility_id: string
  code: string
  discount_type: VoucherDiscountType
  percentage: number | null
  amount: number | null
  status: VoucherStatus
  starts_at: string
  expires_at: string
  max_redemptions: number
}

async function getOwnerClient() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as an owner to manage vouchers." }
  }

  if (user.app_metadata.app_role !== "owner") {
    return { error: "Only owners can create or edit vouchers." }
  }

  return { supabase }
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function parseDiscountType(value: string): VoucherDiscountType | null {
  if (value === "percentage" || value === "amount") {
    return value
  }

  return null
}

function parseStatus(value: string): VoucherStatus | null {
  if (value === "active" || value === "disabled" || value === "expired") {
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

function parsePositiveNumber(value: string) {
  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null
  }

  return parsed
}

function parseDateBoundary(value: string, boundary: "start" | "end") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const time = boundary === "start" ? "00:00:00" : "23:59:59"
  const zonedDate = `${value}T${time}+07:00`
  const parsed = new Date(zonedDate)

  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return zonedDate
}

function parseVoucherPayload(
  formData: FormData
): VoucherPayload | { error: string } {
  const facilityId = stringValue(formData, "facilityId")
  const code = stringValue(formData, "code").toUpperCase()
  const discountType = parseDiscountType(stringValue(formData, "discountType"))
  const status = parseStatus(stringValue(formData, "status"))
  const startsAt = parseDateBoundary(stringValue(formData, "startsAt"), "start")
  const expiresAt = parseDateBoundary(stringValue(formData, "expiresAt"), "end")
  const quantity = parsePositiveInteger(stringValue(formData, "quantity"))

  if (!facilityId) {
    return { error: "Select a facility for this voucher." }
  }

  if (!code) {
    return { error: "Enter a voucher code." }
  }

  if (!/^[A-Z0-9_-]+$/.test(code)) {
    return {
      error:
        "Voucher codes can only use letters, numbers, underscores, or hyphens.",
    }
  }

  if (!discountType) {
    return { error: "Select a valid discount type." }
  }

  if (!status) {
    return { error: "Select a valid voucher status." }
  }

  if (!startsAt) {
    return { error: "Enter a valid launch date." }
  }

  if (!expiresAt) {
    return { error: "Enter a valid end date." }
  }

  if (new Date(startsAt) >= new Date(expiresAt)) {
    return { error: "End date must be after the launch date." }
  }

  if (!quantity) {
    return { error: "Enter a positive voucher quantity." }
  }

  if (discountType === "percentage") {
    const percentage = parsePositiveNumber(stringValue(formData, "percentage"))

    if (!percentage || percentage > 100) {
      return { error: "Enter a percentage between 1 and 100." }
    }

    return {
      facility_id: facilityId,
      code,
      discount_type: "percentage",
      percentage,
      amount: null,
      status,
      starts_at: startsAt,
      expires_at: expiresAt,
      max_redemptions: quantity,
    }
  }

  const amount = parsePositiveNumber(stringValue(formData, "amount"))

  if (!amount) {
    return { error: "Enter a positive discount amount." }
  }

  return {
    facility_id: facilityId,
    code,
    discount_type: "amount",
    percentage: null,
    amount,
    status,
    starts_at: startsAt,
    expires_at: expiresAt,
    max_redemptions: quantity,
  }
}

export async function createVoucher(
  _state: VoucherFormState,
  formData: FormData
): Promise<VoucherFormState> {
  const payload = parseVoucherPayload(formData)

  if ("error" in payload) {
    return { error: payload.error }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const supabase = ownerClient.supabase
  const { error } = await supabase.from("vouchers").insert(payload)

  if (error) {
    return { error: `Unable to create voucher: ${error.message}` }
  }

  revalidatePath("/vouchers")
  redirect("/vouchers")
}

export async function updateVoucher(
  _state: VoucherFormState,
  formData: FormData
): Promise<VoucherFormState> {
  const originalCode = stringValue(formData, "originalCode").toUpperCase()

  if (!originalCode) {
    return { error: "Select a voucher to edit." }
  }

  const payload = parseVoucherPayload(formData)

  if ("error" in payload) {
    return { error: payload.error }
  }

  const ownerClient = await getOwnerClient()

  if ("error" in ownerClient) {
    return { error: ownerClient.error }
  }

  const supabase = ownerClient.supabase
  const { error } = await supabase
    .from("vouchers")
    .update(payload)
    .eq("code", originalCode)

  if (error) {
    return { error: `Unable to update voucher: ${error.message}` }
  }

  revalidatePath("/vouchers")
  revalidatePath(`/voucher/view=${encodeURIComponent(payload.code)}`)
  redirect(`/voucher/view=${encodeURIComponent(payload.code)}`)
}
