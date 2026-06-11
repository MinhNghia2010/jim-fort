import { ClipboardList, DollarSign, Dumbbell, Users } from "lucide-react"

import { SummaryCard } from "@/components/SummaryCard"
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
      <SummaryCard
        title="Active members"
        value={activeMembers}
        description={`${newMembersThisMonth} new this month`}
        icon={Users}
      />
      <SummaryCard
        title="Pending requests"
        value={pendingRequestCount}
        description="Payment and PT setup queue"
        icon={ClipboardList}
      />
      <SummaryCard
        title="Monthly revenue"
        value={currencyFormatter.format(monthlyRevenue)}
        description="Paid subscription payments"
        icon={DollarSign}
      />
      <SummaryCard
        title="Equipment issues"
        value={equipmentIssueCount}
        description="Maintenance or broken records"
        icon={Dumbbell}
      />
    </div>
  )
}
