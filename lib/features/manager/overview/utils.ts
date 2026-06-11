import {
  equipmentStatuses,
  formatUtcMonthKey,
  monthFormatter,
  type MonthlyMetric,
} from "@/lib/owner-overview"

import type {
  FeedbackRecord,
  PaymentRecord,
  StaffRecord,
  SubscriptionRecord,
} from "./data"

export type ManagerOverviewMonthBucket = {
  month: string
  monthKey: string
  start: Date
  end: Date
}

export function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function addUtcMonths(date: Date, amount: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
  )
}

export function getMonthBuckets(
  count: number,
  anchor = new Date()
): ManagerOverviewMonthBucket[] {
  const anchorMonth = new Date(
    Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1)
  )

  return Array.from({ length: count }, (_, index) => {
    const start = addUtcMonths(anchorMonth, index - count + 1)

    return {
      month: monthFormatter.format(start),
      monthKey: formatUtcMonthKey(start),
      start,
      end: addUtcMonths(start, 1),
    }
  })
}

function getDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

export function isInRange(date: Date | null, start: Date, end: Date) {
  return date !== null && date >= start && date < end
}

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

export function getSubscriptionStartDate(subscription: SubscriptionRecord) {
  return getDate(subscription.activated_at) ?? getDate(subscription.created_at)
}

export function countUniqueMembers(
  subscriptions: readonly SubscriptionRecord[]
) {
  return new Set(subscriptions.map((subscription) => subscription.member_id))
    .size
}

export function sumPaymentsInRange(
  payments: readonly PaymentRecord[],
  start: Date,
  end: Date
) {
  return payments.reduce((sum, payment) => {
    const paidAt = getDate(payment.paid_at ?? payment.created_at)

    if (!isInRange(paidAt, start, end)) {
      return sum
    }

    return sum + toNumber(payment.amount)
  }, 0)
}

export function getRevenueByMonth(
  payments: readonly PaymentRecord[],
  monthBuckets: readonly ManagerOverviewMonthBucket[]
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => ({
    month: bucket.month,
    monthKey: bucket.monthKey,
    value: sumPaymentsInRange(payments, bucket.start, bucket.end),
  }))
}

export function getNewMembersByMonth(
  subscriptions: readonly SubscriptionRecord[],
  monthBuckets: readonly ManagerOverviewMonthBucket[]
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => {
    const memberIds = new Set<string>()

    subscriptions.forEach((subscription) => {
      if (
        isInRange(
          getSubscriptionStartDate(subscription),
          bucket.start,
          bucket.end
        )
      ) {
        memberIds.add(subscription.member_id)
      }
    })

    return {
      month: bucket.month,
      monthKey: bucket.monthKey,
      value: memberIds.size,
    }
  })
}

export function formatPercent(count: number, total: number) {
  if (total === 0) {
    return 0
  }

  return Math.round((count / total) * 100)
}

export function getPackageName(subscription: SubscriptionRecord) {
  return (
    getSingleRelation(subscription.membership_packages)?.name?.trim() ||
    "Membership"
  )
}

export function getMemberName(subscription: SubscriptionRecord) {
  return getSingleRelation(subscription.users)?.full_name?.trim() || "Member"
}

export function getFeedbackMemberName(feedback: FeedbackRecord) {
  return getSingleRelation(feedback.member)?.full_name?.trim() || "Member"
}

export function getTopPackages(
  activeSubscriptions: readonly SubscriptionRecord[]
) {
  const packageCounts = new Map<string, number>()

  activeSubscriptions.forEach((subscription) => {
    const packageName = getPackageName(subscription)
    packageCounts.set(packageName, (packageCounts.get(packageName) ?? 0) + 1)
  })

  return Array.from(packageCounts.entries())
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 5)
}

export function getEquipmentCounts(
  equipments: readonly { status: (typeof equipmentStatuses)[number] }[]
) {
  return equipmentStatuses.map((status) => ({
    status,
    count: equipments.filter((equipment) => equipment.status === status).length,
  }))
}

export function getActiveStaffCount(
  staffs: readonly StaffRecord[],
  uniquePtCount: number
) {
  return (
    staffs.filter((staff) => staff.status === "active").length + uniquePtCount
  )
}

export function getStaffRoleCount(
  staffs: readonly StaffRecord[],
  uniquePtCount: number
) {
  return new Set([
    ...staffs.flatMap((staff) => (staff.role ? [staff.role] : [])),
    ...(uniquePtCount ? ["pt"] : []),
  ]).size
}
