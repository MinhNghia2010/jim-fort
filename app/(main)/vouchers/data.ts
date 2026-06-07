import type {
  OwnerVouchersPageProps,
  VoucherView,
  VoucherViewStatus,
} from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import type {
  OwnerVoucherDetailPageProps,
  VoucherRedemptionView,
} from "@/components/screens/owner/vouchers/OwnerVoucherDetailPage"
import type {
  VoucherFormData,
  VoucherFormValues,
} from "@/components/screens/owner/vouchers/form/types"
import { createClient } from "@/lib/supabase/server"

type FacilityRow = {
  id: string
  name: string
}

type VoucherRow = {
  id: string
  facility_id: string
  code: string
  discount_type: "percentage" | "amount"
  percentage: string | number | null
  amount: string | number | null
  status: "active" | "disabled" | "expired"
  starts_at: string | null
  expires_at: string | null
  max_redemptions: string | number | null
  created_at?: string | null
  updated_at?: string | null
}

type VoucherRedemptionRow = {
  id?: string
  voucher_id: string
  member_id?: string
  subscription_id?: string
  discount_amount: string | number
  redeemed_at: string
  member?: UserRelation
  subscription?: SubscriptionRelation
}

type UserRow = {
  full_name: string | null
}

type PackageRow = {
  name: string | null
}

type SubscriptionRow = {
  package?: PackageRelation
}

type UserRelation = UserRow | UserRow[] | null
type PackageRelation = PackageRow | PackageRow[] | null
type SubscriptionRelation = SubscriptionRow | SubscriptionRow[] | null

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function formatDate(value: string | null, fallback: string) {
  return value ? dateFormatter.format(new Date(value)) : fallback
}

function formatDateTime(value: string | null | undefined, fallback: string) {
  return value ? dateTimeFormatter.format(new Date(value)) : fallback
}

function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function getFacilityLabel(facilities: readonly FacilityRow[]) {
  if (facilities.length === 1) {
    return facilities[0].name
  }

  if (facilities.length > 1) {
    return `${facilities.length} accessible facilities`
  }

  return "No accessible facility"
}

function getVoucherStatus(
  voucher: VoucherRow,
  usage: number,
  quantity: number,
  now: Date
): VoucherViewStatus {
  if (usage >= quantity) {
    return "redeemed"
  }

  if (voucher.status !== "active") {
    return voucher.status
  }

  if (voucher.starts_at && new Date(voucher.starts_at) > now) {
    return "scheduled"
  }

  if (voucher.expires_at && new Date(voucher.expires_at) <= now) {
    return "expired"
  }

  return "active"
}

function formatDiscount(voucher: VoucherRow) {
  if (voucher.discount_type === "percentage") {
    return `${toNumber(voucher.percentage)}% off`
  }

  return `${currencyFormatter.format(toNumber(voucher.amount))} off`
}

function toPositiveInteger(value: string | number | null | undefined) {
  const number = Number(value ?? 1)

  if (!Number.isInteger(number) || number <= 0) {
    return 1
  }

  return number
}

function dateInputValue(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
  }).formatToParts(date)
  const valueByType = new Map(parts.map((part) => [part.type, part.value]))

  return `${valueByType.get("year")}-${valueByType.get("month")}-${valueByType.get("day")}`
}

function toFormNumber(
  value: string | number | null | undefined,
  fallback = ""
) {
  if (value === null || value === undefined) {
    return fallback
  }

  return String(value)
}

function voucherToFormValues(voucher: VoucherRow): VoucherFormValues {
  const now = new Date()

  return {
    facilityId: voucher.facility_id,
    code: voucher.code,
    discountType: voucher.discount_type,
    percentage: toFormNumber(voucher.percentage, "10"),
    amount: toFormNumber(voucher.amount, "10"),
    status: voucher.status,
    startsAt: voucher.starts_at
      ? dateInputValue(new Date(voucher.starts_at))
      : dateInputValue(now),
    expiresAt: voucher.expires_at
      ? dateInputValue(new Date(voucher.expires_at))
      : dateInputValue(addDays(now, 30)),
    quantity: String(toPositiveInteger(voucher.max_redemptions)),
  }
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date)
  nextDate.setUTCDate(nextDate.getUTCDate() + days)

  return nextDate
}

function decodeRouteValue(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function normalizeVoucherCode(value: string) {
  const decodedValue = decodeRouteValue(value)
  const routeValue = decodedValue.startsWith("view=")
    ? decodedValue.slice("view=".length)
    : decodedValue

  return routeValue.trim().toUpperCase()
}

export async function getVouchersPageData(): Promise<OwnerVouchersPageProps> {
  const supabase = await createClient()
  const now = new Date()

  const [facilitiesResult, vouchersResult, redemptionsResult] =
    await Promise.all([
      supabase
        .from("gym_facilities")
        .select("id, name")
        .order("created_at", { ascending: true }),
      supabase
        .from("vouchers")
        .select(
          "id, code, discount_type, percentage, amount, status, starts_at, expires_at, max_redemptions"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("voucher_redemptions")
        .select("voucher_id, discount_amount, redeemed_at"),
    ])

  const queryError = [
    facilitiesResult.error,
    vouchersResult.error,
    redemptionsResult.error,
  ].find(Boolean)

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const voucherRows = (vouchersResult.data ?? []) as VoucherRow[]
  const redemptionRows = (redemptionsResult.data ??
    []) as VoucherRedemptionRow[]
  const redemptionCountByVoucher = new Map<string, number>()

  for (const redemption of redemptionRows) {
    redemptionCountByVoucher.set(
      redemption.voucher_id,
      (redemptionCountByVoucher.get(redemption.voucher_id) ?? 0) + 1
    )
  }

  const vouchers: VoucherView[] = voucherRows.map((voucher) => {
    const usage = redemptionCountByVoucher.get(voucher.id) ?? 0
    const quantity = toPositiveInteger(voucher.max_redemptions)

    return {
      code: voucher.code,
      discountLabel: formatDiscount(voucher),
      usage,
      quantity,
      startsAt: voucher.starts_at,
      startsAtLabel: formatDate(voucher.starts_at, "Immediately"),
      expiresAt: voucher.expires_at,
      expiresAtLabel: formatDate(voucher.expires_at, "No expiry"),
      status: getVoucherStatus(voucher, usage, quantity, now),
    }
  })

  const activeVoucherCount = vouchers.filter(
    (voucher) => voucher.status === "active"
  ).length
  const discountImpact = redemptionRows.reduce(
    (total, redemption) => total + toNumber(redemption.discount_amount),
    0
  )

  return {
    facilityLabel: getFacilityLabel(facilities),
    vouchers,
    activeVoucherCount,
    redeemedVoucherCount: redemptionRows.length,
    discountImpactLabel: currencyFormatter.format(discountImpact),
    errorMessage: queryError?.message,
  }
}

export async function getVoucherFormData(): Promise<VoucherFormData> {
  const supabase = await createClient()
  const facilitiesResult = await supabase
    .from("gym_facilities")
    .select("id, name")
    .order("created_at", { ascending: true })
  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const defaultFacilityId = facilities[0]?.id ?? ""
  const now = new Date()
  const defaultValues: VoucherFormValues = {
    facilityId: defaultFacilityId,
    code: "",
    discountType: "percentage",
    percentage: "10",
    amount: "10",
    status: "active",
    startsAt: dateInputValue(now),
    expiresAt: dateInputValue(addDays(now, 30)),
    quantity: "100",
  }

  return {
    facilities,
    defaultValues,
    errorMessage: facilitiesResult.error?.message,
  }
}

export async function getVoucherEditFormData(
  voucherCode: string
): Promise<VoucherFormData | null> {
  const supabase = await createClient()
  const normalizedVoucherCode = normalizeVoucherCode(voucherCode)
  const [facilitiesResult, voucherResult] = await Promise.all([
    supabase
      .from("gym_facilities")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("vouchers")
      .select(
        "id, facility_id, code, discount_type, percentage, amount, status, starts_at, expires_at, max_redemptions"
      )
      .eq("code", normalizedVoucherCode)
      .maybeSingle(),
  ])

  const voucher = voucherResult.data as VoucherRow | null

  if (!voucher && !voucherResult.error) {
    return null
  }

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const defaultFacilityId = facilities[0]?.id ?? ""
  const now = new Date()
  const fallbackValues: VoucherFormValues = {
    facilityId: defaultFacilityId,
    code: "",
    discountType: "percentage",
    percentage: "10",
    amount: "10",
    status: "active",
    startsAt: dateInputValue(now),
    expiresAt: dateInputValue(addDays(now, 30)),
    quantity: "100",
  }

  return {
    voucherCode: voucher?.code ?? normalizedVoucherCode,
    facilities,
    defaultValues: voucher ? voucherToFormValues(voucher) : fallbackValues,
    errorMessage:
      facilitiesResult.error?.message ?? voucherResult.error?.message,
  }
}

export async function getVoucherDetailData(
  voucherCode: string
): Promise<OwnerVoucherDetailPageProps | null> {
  const supabase = await createClient()
  const normalizedVoucherCode = normalizeVoucherCode(voucherCode)
  const [facilitiesResult, voucherResult] = await Promise.all([
    supabase
      .from("gym_facilities")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("vouchers")
      .select(
        "id, facility_id, code, discount_type, percentage, amount, status, starts_at, expires_at, max_redemptions, created_at, updated_at"
      )
      .eq("code", normalizedVoucherCode)
      .maybeSingle(),
  ])

  const voucher = voucherResult.data as VoucherRow | null

  if (!voucher && !voucherResult.error) {
    return null
  }

  const redemptionsResult = voucher
    ? await supabase
        .from("voucher_redemptions")
        .select(
          `
            id,
            voucher_id,
            discount_amount,
            redeemed_at,
            member:users!voucher_redemptions_member_id_fkey(
              full_name
            ),
            subscription:membership_subscriptions!voucher_redemptions_subscription_id_fkey(
              package:membership_packages!membership_subscriptions_package_id_fkey(
                name
              )
            )
          `
        )
        .eq("voucher_id", voucher.id)
        .order("redeemed_at", { ascending: false })
    : { data: [], error: null }

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const redemptions = (redemptionsResult.data ??
    []) as unknown as VoucherRedemptionRow[]
  const usage = redemptions.length
  const quantity = toPositiveInteger(voucher?.max_redemptions)
  const discountImpact = redemptions.reduce(
    (total, redemption) => total + toNumber(redemption.discount_amount),
    0
  )
  const redemptionRows: VoucherRedemptionView[] = redemptions.map(
    (redemption, index) => {
      const member = getSingleRelation(redemption.member)
      const subscription = getSingleRelation(redemption.subscription)
      const membershipPackage = getSingleRelation(subscription?.package)

      return {
        id: redemption.id ?? `${redemption.voucher_id}-${index}`,
        memberName: member?.full_name?.trim() || "Unknown member",
        membershipPlanName:
          membershipPackage?.name?.trim() || "Unknown membership plan",
        discountAmount: toNumber(redemption.discount_amount),
        discountAmountLabel: currencyFormatter.format(
          toNumber(redemption.discount_amount)
        ),
        redeemedAt: redemption.redeemed_at,
        redeemedAtLabel: formatDateTime(redemption.redeemed_at, "Not recorded"),
      }
    }
  )

  if (!voucher) {
    return null
  }

  const facilityName =
    facilities.find((facility) => facility.id === voucher.facility_id)?.name ??
    "Unknown facility"

  return {
    facilityLabel: facilityName,
    voucher: {
      code: voucher.code,
      discountLabel: formatDiscount(voucher),
      usage,
      quantity,
      startsAt: voucher.starts_at,
      startsAtLabel: formatDate(voucher.starts_at, "Immediately"),
      expiresAt: voucher.expires_at,
      expiresAtLabel: formatDate(voucher.expires_at, "No expiry"),
      status: getVoucherStatus(voucher, usage, quantity, new Date()),
      createdAtLabel: formatDateTime(voucher.created_at, "Not recorded"),
      updatedAtLabel: formatDateTime(voucher.updated_at, "Not recorded"),
      discountImpactLabel: currencyFormatter.format(discountImpact),
    },
    redemptions: redemptionRows,
    errorMessage:
      facilitiesResult.error?.message ??
      voucherResult.error?.message ??
      redemptionsResult.error?.message,
  }
}
