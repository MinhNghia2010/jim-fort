import { ClipboardList, DollarSign, Dumbbell, Users } from "lucide-react"

import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { currencyFormatter } from "@/lib/owner-overview"

type ManagerOverviewMetricGridProps = {
  activeMembers: number
  equipmentIssueCount: number
  monthlyRevenue: number
  newMembersThisMonth: number
  pendingRequestCount: number
}

export function ManagerOverviewMetricGrid({
  activeMembers,
  equipmentIssueCount,
  monthlyRevenue,
  newMembersThisMonth,
  pendingRequestCount,
}: ManagerOverviewMetricGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ManagementMetricCard
        title="Active members"
        value={activeMembers}
        detail={`${newMembersThisMonth} new this month`}
        icon={Users}
      />
      <ManagementMetricCard
        title="Pending requests"
        value={pendingRequestCount}
        detail="Payment and PT setup queue"
        icon={ClipboardList}
      />
      <ManagementMetricCard
        title="Monthly revenue"
        value={currencyFormatter.format(monthlyRevenue)}
        detail="Paid subscription payments"
        icon={DollarSign}
      />
      <ManagementMetricCard
        title="Equipment issues"
        value={equipmentIssueCount}
        detail="Maintenance or broken records"
        icon={Dumbbell}
      />
    </div>
  )
}
