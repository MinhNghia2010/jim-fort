import {
  currencyFormatter,
  dateFormatter,
  equipmentStatuses,
  formatUtcMonthKey,
  membershipColorClasses,
  monthFormatter,
  roomColorClasses,
  type AverageMonthlyMetric,
  type EquipmentRecord,
  type EquipmentStatus,
  type EquipmentStatusCount,
  type FacilityDistributionItem,
  type MembershipPackageRecord,
  type MembershipPackageRoomRecord,
  type MembershipTypeMetric,
  type MonthBucket,
  type MonthlyMetric,
  type OwnerOverviewPageProps,
  type PaymentRecord,
  type RoomRecord,
  type SubscriptionRecord,
} from "@/lib/owner-overview"
import { createClient } from "@/lib/supabase/server"

function getSingleRelation<T>(relation: T | T[] | null) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function addUtcMonths(date: Date, amount: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
  )
}

function getMonthBuckets(count: number, anchor = new Date()): MonthBucket[] {
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

function getDate(value: string | null) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function isInRange(date: Date | null, start: Date, end: Date) {
  return date !== null && date >= start && date < end
}

function toNumber(value: number | string) {
  const numberValue = typeof value === "number" ? value : Number(value)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function sumPaymentsInRange(
  payments: readonly PaymentRecord[],
  start: Date,
  end: Date
) {
  return payments.reduce((sum, payment) => {
    const paidAt = getDate(payment.paid_at)

    if (!isInRange(paidAt, start, end)) {
      return sum
    }

    return sum + toNumber(payment.amount)
  }, 0)
}

function roundToTenth(value: number) {
  return Math.round(value * 10) / 10
}

function getGrowthPercentage(current: number, previous: number) {
  if (previous === 0) {
    return undefined
  }

  return roundToTenth(((current - previous) / previous) * 100)
}

function formatAverage(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1)
}

function formatPeriodLabel(monthBuckets: readonly MonthBucket[]) {
  const firstBucket = monthBuckets[0]
  const lastBucket = monthBuckets[monthBuckets.length - 1]

  if (!firstBucket || !lastBucket) {
    return ""
  }

  const lastVisibleDay = new Date(lastBucket.end.getTime() - 24 * 60 * 60 * 1000)

  return `${dateFormatter.format(firstBucket.start)} - ${dateFormatter.format(
    lastVisibleDay
  )}`
}

function countUniqueMembers(subscriptions: readonly SubscriptionRecord[]) {
  return new Set(subscriptions.map((subscription) => subscription.member_id))
    .size
}

function getSubscriptionStartDate(subscription: SubscriptionRecord) {
  return getDate(subscription.activated_at) ?? getDate(subscription.created_at)
}

function getNewMembersByMonth(
  subscriptions: readonly SubscriptionRecord[],
  monthBuckets: readonly MonthBucket[]
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => {
    const memberIds = new Set<string>()

    subscriptions.forEach((subscription) => {
      if (
        isInRange(getSubscriptionStartDate(subscription), bucket.start, bucket.end)
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

function getRevenueByMonth(
  payments: readonly PaymentRecord[],
  monthBuckets: readonly MonthBucket[]
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => ({
    month: bucket.month,
    monthKey: bucket.monthKey,
    value: sumPaymentsInRange(payments, bucket.start, bucket.end),
  }))
}

function buildEquipmentOverview(equipmentRows: readonly EquipmentRecord[]) {
  const roomNames = new Set<string>()
  const equipmentCountByStatus = new Map<EquipmentStatus, number>()

  equipmentRows.forEach((equipment) => {
    const room = getSingleRelation(equipment.room)

    if (room) {
      roomNames.add(room.name)
    }

    equipmentCountByStatus.set(
      equipment.status,
      (equipmentCountByStatus.get(equipment.status) ?? 0) + 1
    )
  })

  return {
    equipmentRooms: Array.from(roomNames).sort(),
    equipmentStatusCounts: equipmentStatuses.map((status) => ({
      status,
      count: equipmentCountByStatus.get(status) ?? 0,
    })) satisfies EquipmentStatusCount[],
  }
}

function buildFacilityDistribution(
  activeSubscriptions: readonly SubscriptionRecord[],
  packageRooms: readonly MembershipPackageRoomRecord[],
  rooms: readonly RoomRecord[]
): FacilityDistributionItem[] {
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]))
  const roomIdsByPackageId = new Map<string, string[]>()

  packageRooms.forEach((packageRoom) => {
    const roomIds = roomIdsByPackageId.get(packageRoom.package_id) ?? []
    roomIds.push(packageRoom.room_id)
    roomIdsByPackageId.set(packageRoom.package_id, roomIds)
  })

  const roomAccessCounts = new Map<string, number>()

  activeSubscriptions.forEach((subscription) => {
    const roomIds = roomIdsByPackageId.get(subscription.package_id) ?? []

    roomIds.forEach((roomId) => {
      const roomName = roomNameById.get(roomId)

      if (roomName) {
        roomAccessCounts.set(roomName, (roomAccessCounts.get(roomName) ?? 0) + 1)
      }
    })
  })

  const totalAccesses = Array.from(roomAccessCounts.values()).reduce(
    (sum, count) => sum + count,
    0
  )

  if (totalAccesses === 0) {
    return []
  }

  return Array.from(roomAccessCounts.entries())
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .map(([roomName, count], index) => ({
      label: roomName,
      code: roomName.trim().slice(0, 1).toUpperCase(),
      percentage: roundToTenth((count / totalAccesses) * 100),
      colorClass: roomColorClasses[index % roomColorClasses.length],
    }))
}

function buildMembershipTypes(
  activeSubscriptions: readonly SubscriptionRecord[],
  packages: readonly MembershipPackageRecord[]
): MembershipTypeMetric[] {
  const activeCountsByPackageId = new Map<string, number>()

  activeSubscriptions.forEach((subscription) => {
    activeCountsByPackageId.set(
      subscription.package_id,
      (activeCountsByPackageId.get(subscription.package_id) ?? 0) + 1
    )
  })

  const totalActive = activeSubscriptions.length

  if (totalActive === 0) {
    return []
  }

  return packages
    .map((membershipPackage, index) => {
      const count = activeCountsByPackageId.get(membershipPackage.id) ?? 0
      const colors =
        membershipColorClasses[index % membershipColorClasses.length]

      return {
        label: membershipPackage.name,
        count,
        percentage: roundToTenth((count / totalActive) * 100),
        dotColorClass: colors.dotColorClass,
        color: colors.color,
      }
    })
    .filter((membership) => membership.percentage > 0)
}

async function getOverviewData() {
  const supabase = await createClient()
  const [
    equipmentResult,
    paymentsResult,
    subscriptionsResult,
    packagesResult,
    packageRoomsResult,
    roomsResult,
  ] = await Promise.all([
    supabase.from("gym_equipments").select("status, room:rooms(name)"),
    supabase
      .from("membership_payments")
      .select("amount, paid_at")
      .eq("status", "paid")
      .not("paid_at", "is", null),
    supabase
      .from("membership_subscriptions")
      .select("id, member_id, package_id, status, activated_at, created_at"),
    supabase.from("membership_packages").select("id, name").order("name"),
    supabase.from("membership_package_rooms").select("package_id, room_id"),
    supabase.from("rooms").select("id, name"),
  ])

  const errorMessages = [
    equipmentResult.error,
    paymentsResult.error,
    subscriptionsResult.error,
    packagesResult.error,
    packageRoomsResult.error,
    roomsResult.error,
  ].flatMap((error) => (error ? [error.message] : []))

  if (errorMessages.length > 0) {
    throw new Error(`Unable to load owner overview: ${errorMessages.join("; ")}`)
  }

  return {
    equipmentRows: (equipmentResult.data ?? []) as unknown as EquipmentRecord[],
    paidPayments: (paymentsResult.data ?? []) as PaymentRecord[],
    subscriptions: (subscriptionsResult.data ?? []) as SubscriptionRecord[],
    membershipPackages: (packagesResult.data ??
      []) as MembershipPackageRecord[],
    packageRooms: (packageRoomsResult.data ??
      []) as MembershipPackageRoomRecord[],
    rooms: (roomsResult.data ?? []) as RoomRecord[],
  }
}

export async function getOwnerOverviewPageProps(): Promise<OwnerOverviewPageProps> {
  const {
    equipmentRows,
    paidPayments,
    subscriptions,
    membershipPackages,
    packageRooms,
    rooms,
  } = await getOverviewData()
  const monthBuckets = getMonthBuckets(5)
  const firstMonth = monthBuckets[0]
  const lastMonth = monthBuckets[monthBuckets.length - 1]
  const previousMonth = monthBuckets[monthBuckets.length - 2]
  const previousWindowStart = addUtcMonths(firstMonth.start, -monthBuckets.length)
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  )
  const currentRevenue = sumPaymentsInRange(
    paidPayments,
    firstMonth.start,
    lastMonth.end
  )
  const previousRevenue = sumPaymentsInRange(
    paidPayments,
    previousWindowStart,
    firstMonth.start
  )
  const monthlyRevenue = sumPaymentsInRange(
    paidPayments,
    lastMonth.start,
    lastMonth.end
  )
  const previousMonthlyRevenue = previousMonth
    ? sumPaymentsInRange(paidPayments, previousMonth.start, previousMonth.end)
    : 0
  const membersByMonth = getNewMembersByMonth(activeSubscriptions, monthBuckets)
  const averageNewMembers =
    membersByMonth.reduce((sum, month) => sum + month.value, 0) /
    monthBuckets.length
  const activeMembershipsByMonth = monthBuckets.map(
    (bucket) =>
      activeSubscriptions.filter((subscription) => {
        const startedAt = getSubscriptionStartDate(subscription)

        return startedAt !== null && startedAt < bucket.end
      }).length
  )
  const averageActiveMemberships =
    activeMembershipsByMonth.reduce((sum, count) => sum + count, 0) /
    monthBuckets.length
  const previousActiveMemberCount = countUniqueMembers(
    activeSubscriptions.filter((subscription) => {
      const startedAt = getSubscriptionStartDate(subscription)

      return startedAt !== null && startedAt < lastMonth.start
    })
  )
  const averageMonthlyMetrics: AverageMonthlyMetric[] = [
    {
      label: "Gym revenue",
      value: currencyFormatter.format(currentRevenue / monthBuckets.length),
    },
    {
      label: "New members",
      value: formatAverage(averageNewMembers),
      detail: "average joins",
    },
    {
      label: "Active memberships",
      value: formatAverage(averageActiveMemberships),
      detail: "monthly average",
    },
  ]
  const { equipmentRooms, equipmentStatusCounts } =
    buildEquipmentOverview(equipmentRows)
  const totalMembers = countUniqueMembers(activeSubscriptions)

  return {
    totalRevenue: currentRevenue,
    previousRevenue,
    revenueChange: currentRevenue - previousRevenue,
    revenueGrowth: getGrowthPercentage(currentRevenue, previousRevenue),
    periodLabel: formatPeriodLabel(monthBuckets),
    totalMembers,
    memberGrowth: getGrowthPercentage(totalMembers, previousActiveMemberCount),
    monthlyRevenue,
    monthlyRevenueGrowth: getGrowthPercentage(
      monthlyRevenue,
      previousMonthlyRevenue
    ),
    revenueByMonth: getRevenueByMonth(paidPayments, monthBuckets),
    membersByMonth,
    averageMonthlyMetrics,
    facilityDistribution: buildFacilityDistribution(
      activeSubscriptions,
      packageRooms,
      rooms
    ),
    membershipTypes: buildMembershipTypes(
      activeSubscriptions,
      membershipPackages
    ),
    totalActiveMemberships: activeSubscriptions.length,
    equipmentRooms,
    equipmentStatusCounts,
  }
}
