export type EquipmentStatus = "active" | "maintenance" | "broken" | "retired"

export interface EquipmentStatusCount {
  status: EquipmentStatus
  count: number
}

export interface MonthlyMetric {
  month: string
  value: number
}

export interface AverageMonthlyMetric {
  label: string
  value: string
  detail?: string
}

export interface FacilityDistributionItem {
  label: string
  code: string
  percentage: number
  colorClass: string
}

export interface MembershipTypeMetric {
  label: string
  percentage: number
  dotColorClass: string
  progressColorClass: string
}

export interface EquipmentRoomRecord {
  name: string
}

export interface EquipmentRecord {
  status: EquipmentStatus
  room: EquipmentRoomRecord | EquipmentRoomRecord[] | null
}

export interface PaymentRecord {
  amount: number | string
  paid_at: string | null
}

export interface SubscriptionRecord {
  id: string
  member_id: string
  package_id: string
  status: string
  activated_at: string | null
  created_at: string
}

export interface MembershipPackageRecord {
  id: string
  name: string
}

export interface MembershipPackageRoomRecord {
  package_id: string
  room_id: string
}

export interface RoomRecord {
  id: string
  name: string
}

export interface MonthBucket {
  month: string
  start: Date
  end: Date
}

export interface OwnerOverviewPageProps {
  totalRevenue: number
  previousRevenue: number
  revenueChange: number
  revenueGrowth?: number
  periodLabel: string
  totalMembers: number
  memberGrowth?: number
  monthlyRevenue: number
  monthlyRevenueGrowth?: number
  revenueByMonth: readonly MonthlyMetric[]
  membersByMonth: readonly MonthlyMetric[]
  averageMonthlyMetrics: readonly AverageMonthlyMetric[]
  facilityDistribution: readonly FacilityDistributionItem[]
  membershipTypes: readonly MembershipTypeMetric[]
  totalActiveMemberships: number
  equipmentRooms: readonly string[]
  equipmentStatusCounts: readonly EquipmentStatusCount[]
}

export const equipmentStatuses: readonly EquipmentStatus[] = [
  "active",
  "maintenance",
  "broken",
  "retired",
]

export const roomColorClasses = [
  "bg-chart-1",
  "bg-chart-3",
  "bg-chart-5",
  "bg-chart-4",
  "bg-chart-2",
] as const

export const membershipColorClasses = [
  {
    dotColorClass: "bg-chart-1",
    progressColorClass: "[&_[data-slot=progress-indicator]]:bg-chart-1",
  },
  {
    dotColorClass: "bg-chart-5",
    progressColorClass: "[&_[data-slot=progress-indicator]]:bg-chart-5",
  },
  {
    dotColorClass: "bg-chart-3",
    progressColorClass: "[&_[data-slot=progress-indicator]]:bg-chart-3",
  },
  {
    dotColorClass: "bg-chart-4",
    progressColorClass: "[&_[data-slot=progress-indicator]]:bg-chart-4",
  },
  {
    dotColorClass: "bg-chart-2",
    progressColorClass: "[&_[data-slot=progress-indicator]]:bg-chart-2",
  },
] as const

export const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  timeZone: "UTC",
})

export const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})
