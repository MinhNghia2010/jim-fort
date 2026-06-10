import type {
  MembershipPlanView,
  OwnerMembershipsPageProps,
} from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import { defaultMembershipColor } from "@/components/screens/owner/memberships/form/constants"
import type {
  MembershipPackageFormData,
  MembershipPackageFormValues,
  MembershipStatus,
} from "@/components/screens/owner/memberships/form/types"
import { createClient } from "@/lib/supabase/server"

type FacilityRow = {
  id: string
  name: string
}

type MembershipPackageRow = {
  id: string
  facility_id: string
  name: string
  description: string | null
  price: string | number
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  status: MembershipStatus
  release_date: string | null
  end_date: string | null
}

type PackageRoomRow = {
  package_id: string
  room_id: string
}

type RoomRow = {
  id: string
  facility_id: string
  name: string
}

type SubscriptionRow = {
  id: string
  member_id: string
  package_id: string
  status: string
  activated_at: string | null
}

type PaymentRow = {
  subscription_id: string
  amount: string | number
  paid_at: string | null
}

const planColors = [
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
] as const

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

function toNumber(value: string | number | null | undefined) {
  const number = Number(value ?? 0)
  return Number.isFinite(number) ? number : 0
}

function formatTerm(packageRow: MembershipPackageRow) {
  if (packageRow.has_pt) {
    return `${packageRow.session_count ?? 0} sessions`
  }

  const days = packageRow.duration_days ?? 0

  if (days % 365 === 0) {
    const years = days / 365
    return `${years} ${years === 1 ? "year" : "years"}`
  }

  if (days % 30 === 0) {
    const months = days / 30
    return `${months} ${months === 1 ? "month" : "months"}`
  }

  return `${days} days`
}

function normalizeStatus(status: string | null | undefined): MembershipStatus {
  if (status === "inactive" || status === "archived") {
    return status
  }

  return "active"
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.valueOf())) {
    return null
  }

  return dateFormatter.format(date)
}

function formatAvailability(packageRow: MembershipPackageRow) {
  const releaseDateLabel = formatDate(packageRow.release_date)
  const endDateLabel = formatDate(packageRow.end_date)

  if (releaseDateLabel && endDateLabel) {
    return `Available ${releaseDateLabel} through ${endDateLabel}`
  }

  if (releaseDateLabel) {
    return `Available from ${releaseDateLabel}`
  }

  if (endDateLabel) {
    return `Available until ${endDateLabel}`
  }

  return "Available immediately"
}

function buildFeatures(
  packageRow: MembershipPackageRow,
  roomNames: readonly string[]
) {
  const features = [
    packageRow.has_pt
      ? `${packageRow.session_count ?? 0} personal training sessions`
      : `${packageRow.duration_days ?? 0} days of facility access`,
    roomNames.length
      ? `Room access: ${roomNames.join(", ")}`
      : "No room access assigned",
    formatAvailability(packageRow),
  ]

  if (packageRow.has_pt) {
    features.push("Personal trainer assignment included")
  }

  return features
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

export async function getMembershipsPageData(): Promise<OwnerMembershipsPageProps> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  )

  const [
    facilitiesResult,
    packagesResult,
    packageRoomsResult,
    roomsResult,
    subscriptionsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("gym_facilities")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("membership_packages")
      .select(
        "id, facility_id, name, description, price, has_pt, duration_days, session_count, status, release_date, end_date"
      )
      .order("price", { ascending: true }),
    supabase.from("membership_package_rooms").select("package_id, room_id"),
    supabase.from("rooms").select("id, facility_id, name"),
    supabase
      .from("membership_subscriptions")
      .select("id, member_id, package_id, status, activated_at"),
    supabase
      .from("membership_payments")
      .select("subscription_id, amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString())
      .lt("paid_at", nextMonthStart.toISOString()),
  ])

  const queryError = [
    facilitiesResult.error,
    packagesResult.error,
    packageRoomsResult.error,
    roomsResult.error,
    subscriptionsResult.error,
    paymentsResult.error,
  ].find(Boolean)

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const packageRows = (packagesResult.data ?? []) as MembershipPackageRow[]
  const packageRoomRows = (packageRoomsResult.data ?? []) as PackageRoomRow[]
  const rooms = (roomsResult.data ?? []) as RoomRow[]
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[]
  const payments = (paymentsResult.data ?? []) as PaymentRow[]

  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]))
  const roomNamesByPackage = new Map<string, string[]>()

  for (const packageRoom of packageRoomRows) {
    const roomName = roomNameById.get(packageRoom.room_id)

    if (!roomName) {
      continue
    }

    const roomNames = roomNamesByPackage.get(packageRoom.package_id) ?? []
    roomNames.push(roomName)
    roomNamesByPackage.set(packageRoom.package_id, roomNames)
  }

  const activeMemberIds = new Set<string>()
  const activeMembersByPackage = new Map<string, Set<string>>()
  const packageIdBySubscription = new Map<string, string>()
  let activationsThisMonth = 0

  for (const subscription of subscriptions) {
    packageIdBySubscription.set(subscription.id, subscription.package_id)

    if (subscription.status !== "active") {
      continue
    }

    activeMemberIds.add(subscription.member_id)
    const packageMembers =
      activeMembersByPackage.get(subscription.package_id) ?? new Set<string>()
    packageMembers.add(subscription.member_id)
    activeMembersByPackage.set(subscription.package_id, packageMembers)

    if (
      subscription.activated_at &&
      subscription.activated_at >= monthStart.toISOString() &&
      subscription.activated_at < nextMonthStart.toISOString()
    ) {
      activationsThisMonth += 1
    }
  }

  const revenueByPackage = new Map<string, number>()
  let revenueThisMonth = 0

  for (const payment of payments) {
    const amount = toNumber(payment.amount)
    const packageId = packageIdBySubscription.get(payment.subscription_id)
    revenueThisMonth += amount

    if (!packageId) {
      continue
    }

    revenueByPackage.set(
      packageId,
      (revenueByPackage.get(packageId) ?? 0) + amount
    )
  }

  const plans: MembershipPlanView[] = packageRows.map((packageRow, index) => {
    const roomNames = (roomNamesByPackage.get(packageRow.id) ?? []).sort()

    return {
      id: packageRow.id,
      name: packageRow.name,
      description:
        packageRow.description ?? "No package description has been added.",
      priceLabel: currencyFormatter.format(toNumber(packageRow.price)),
      termLabel: formatTerm(packageRow),
      status: normalizeStatus(packageRow.status),
      features: buildFeatures(packageRow, roomNames),
      activeMembers: activeMembersByPackage.get(packageRow.id)?.size ?? 0,
      revenueLabel: currencyFormatter.format(
        revenueByPackage.get(packageRow.id) ?? 0
      ),
      color: planColors[index % planColors.length],
    }
  })

  return {
    facilityLabel: getFacilityLabel(facilities),
    plans,
    activeMembers: activeMemberIds.size,
    activeMembersDetail: `${activationsThisMonth} activations this month`,
    revenueThisMonth: currencyFormatter.format(revenueThisMonth),
    revenueDetail: `${payments.length} paid payments this month`,
    errorMessage: queryError?.message,
  }
}

function toFormNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

function buildFormValues({
  packageRow,
  roomIds,
  activeMembers,
  revenueLabel,
  color,
}: {
  packageRow: MembershipPackageRow
  roomIds: readonly string[]
  activeMembers: number
  revenueLabel: string
  color: string
}): MembershipPackageFormValues {
  return {
    id: packageRow.id,
    facilityId: packageRow.facility_id,
    name: packageRow.name,
    description: packageRow.description ?? "",
    price: toFormNumber(packageRow.price),
    planKind: packageRow.has_pt ? "pt" : "access",
    durationDays: toFormNumber(packageRow.duration_days),
    sessionCount: toFormNumber(packageRow.session_count),
    status: normalizeStatus(packageRow.status),
    releaseDate: packageRow.release_date ?? "",
    endDate: packageRow.end_date ?? "",
    roomIds: [...roomIds],
    color,
    features: [],
    activeMembers,
    revenueLabel,
  }
}

export async function getMembershipPackageFormData(
  selectedPackageId?: string
): Promise<MembershipPackageFormData> {
  const supabase = await createClient()
  const now = new Date()
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  )
  const nextMonthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)
  )

  const [
    facilitiesResult,
    roomsResult,
    packagesResult,
    packageRoomsResult,
    subscriptionsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("gym_facilities")
      .select("id, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("rooms")
      .select("id, facility_id, name")
      .order("name", { ascending: true }),
    supabase
      .from("membership_packages")
      .select(
        "id, facility_id, name, description, price, has_pt, duration_days, session_count, status, release_date, end_date"
      )
      .order("price", { ascending: true }),
    supabase.from("membership_package_rooms").select("package_id, room_id"),
    supabase
      .from("membership_subscriptions")
      .select("id, member_id, package_id, status"),
    supabase
      .from("membership_payments")
      .select("subscription_id, amount, paid_at")
      .eq("status", "paid")
      .gte("paid_at", monthStart.toISOString())
      .lt("paid_at", nextMonthStart.toISOString()),
  ])

  const queryError = [
    facilitiesResult.error,
    roomsResult.error,
    packagesResult.error,
    packageRoomsResult.error,
    subscriptionsResult.error,
    paymentsResult.error,
  ].find(Boolean)

  const facilities = (facilitiesResult.data ?? []) as FacilityRow[]
  const rooms = (roomsResult.data ?? []) as RoomRow[]
  const packageRows = (packagesResult.data ?? []) as MembershipPackageRow[]
  const packageRoomRows = (packageRoomsResult.data ?? []) as PackageRoomRow[]
  const subscriptions = (subscriptionsResult.data ?? []) as SubscriptionRow[]
  const payments = (paymentsResult.data ?? []) as PaymentRow[]
  const roomNameById = new Map(rooms.map((room) => [room.id, room.name]))
  const roomIdsByPackage = new Map<string, string[]>()
  const roomNamesByPackage = new Map<string, string[]>()

  for (const packageRoom of packageRoomRows) {
    const roomIds = roomIdsByPackage.get(packageRoom.package_id) ?? []
    roomIds.push(packageRoom.room_id)
    roomIdsByPackage.set(packageRoom.package_id, roomIds)

    const roomName = roomNameById.get(packageRoom.room_id)

    if (!roomName) {
      continue
    }

    const roomNames = roomNamesByPackage.get(packageRoom.package_id) ?? []
    roomNames.push(roomName)
    roomNamesByPackage.set(packageRoom.package_id, roomNames)
  }

  const activeMembersByPackage = new Map<string, Set<string>>()
  const packageIdBySubscription = new Map<string, string>()

  for (const subscription of subscriptions) {
    packageIdBySubscription.set(subscription.id, subscription.package_id)

    if (subscription.status !== "active") {
      continue
    }

    const packageMembers =
      activeMembersByPackage.get(subscription.package_id) ?? new Set<string>()
    packageMembers.add(subscription.member_id)
    activeMembersByPackage.set(subscription.package_id, packageMembers)
  }

  const revenueByPackage = new Map<string, number>()

  for (const payment of payments) {
    const packageId = packageIdBySubscription.get(payment.subscription_id)

    if (!packageId) {
      continue
    }

    revenueByPackage.set(
      packageId,
      (revenueByPackage.get(packageId) ?? 0) + toNumber(payment.amount)
    )
  }

  const packages = packageRows.map((packageRow, index) => {
    const roomIds = (roomIdsByPackage.get(packageRow.id) ?? []).sort()

    return buildFormValues({
      packageRow,
      roomIds,
      activeMembers: activeMembersByPackage.get(packageRow.id)?.size ?? 0,
      revenueLabel: currencyFormatter.format(
        revenueByPackage.get(packageRow.id) ?? 0
      ),
      color: planColors[index % planColors.length],
    })
  })

  const selectedPackage =
    packages.find(
      (membershipPackage) => membershipPackage.id === selectedPackageId
    ) ??
    packages[0] ??
    null
  const defaultFacilityId = facilities[0]?.id ?? ""
  const defaultValues: MembershipPackageFormValues = {
    id: "",
    facilityId: defaultFacilityId,
    name: "",
    description: "",
    price: "0",
    planKind: "access",
    durationDays: "30",
    sessionCount: "10",
    status: "active",
    releaseDate: "",
    endDate: "",
    roomIds: [],
    color: defaultMembershipColor,
    features: [],
    activeMembers: 0,
    revenueLabel: "$0",
  }

  return {
    facilities,
    rooms: rooms.map((room) => ({
      id: room.id,
      facilityId: room.facility_id,
      name: room.name,
    })),
    packages,
    defaultValues,
    selectedPackage,
    errorMessage: queryError?.message,
  }
}
