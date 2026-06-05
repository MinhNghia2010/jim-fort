import type {
  OwnerRevenuePageProps,
  RevenueHistoryRow,
} from "@/components/screens/owner/revenue/OwnerRevenuePage"
import { createClient } from "@/lib/supabase/server"

type UserRecord = {
  full_name: string | null
  phone: string | null
}

type PackageRecord = {
  name: string | null
}

type SubscriptionRecord = {
  id: string
  status: string
  package: PackageRecord | PackageRecord[] | null
}

type PaymentRecord = {
  id: string
  amount: string | number
  method: string | null
  paid_at: string | null
  member: UserRecord | UserRecord[] | null
  subscription: SubscriptionRecord | SubscriptionRecord[] | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const paidAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function getOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function formatMethod(method: string | null) {
  if (!method) {
    return "Not recorded"
  }

  return method
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

function getDateKey(value: string | Date) {
  return dateKeyFormatter.format(new Date(value))
}

function getMonthKey(dateKey: string) {
  return dateKey.slice(0, 7)
}

function getYearKey(dateKey: string) {
  return dateKey.slice(0, 4)
}

function sumRows(rows: readonly RevenueHistoryRow[]) {
  return rows.reduce((total, row) => total + row.amount, 0)
}

function mapPayment(payment: PaymentRecord): RevenueHistoryRow {
  const member = getOne(payment.member)
  const subscription = getOne(payment.subscription)
  const membershipPackage = getOne(subscription?.package ?? null)
  const paidAt = payment.paid_at ?? new Date().toISOString()
  const amount = toNumber(payment.amount)

  return {
    id: payment.id,
    type: "Membership subscription",
    memberName: member?.full_name?.trim() || "Unknown member",
    memberPhone: member?.phone?.trim() || "No phone number",
    packageName: membershipPackage?.name?.trim() || "Unknown package",
    subscriptionStatus: subscription?.status ?? "unknown",
    methodLabel: formatMethod(payment.method),
    paidAt: payment.paid_at,
    paidAtLabel: payment.paid_at
      ? paidAtFormatter.format(new Date(payment.paid_at))
      : "Not recorded",
    paidDateKey: getDateKey(paidAt),
    amount,
    amountLabel: currencyFormatter.format(amount),
  }
}

export async function getOwnerRevenuePageData(): Promise<OwnerRevenuePageProps> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("membership_payments")
    .select(
      `
        id,
        amount,
        method,
        paid_at,
        member:users!membership_payments_member_id_fkey(
          full_name,
          phone
        ),
        subscription:membership_subscriptions!membership_payments_subscription_id_fkey(
          id,
          status,
          package:membership_packages!membership_subscriptions_package_id_fkey(
            name
          )
        )
      `
    )
    .eq("status", "paid")
    .not("paid_at", "is", null)
    .order("paid_at", { ascending: false })

  const rows = ((data ?? []) as unknown as PaymentRecord[]).map(mapPayment)
  const todayKey = getDateKey(new Date())
  const monthKey = getMonthKey(todayKey)
  const yearKey = getYearKey(todayKey)
  const todayRows = rows.filter((row) => row.paidDateKey === todayKey)
  const monthRows = rows.filter(
    (row) => getMonthKey(row.paidDateKey) === monthKey
  )
  const yearRows = rows.filter(
    (row) => getYearKey(row.paidDateKey) === yearKey
  )

  return {
    rows,
    todayTotalLabel: currencyFormatter.format(sumRows(todayRows)),
    monthTotalLabel: currencyFormatter.format(sumRows(monthRows)),
    yearTotalLabel: currencyFormatter.format(sumRows(yearRows)),
    membershipPaymentCount: rows.length,
    errorMessage: error?.message,
  }
}
