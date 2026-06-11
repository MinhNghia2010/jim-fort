import { Activity, BadgeCheck, DollarSign, UserPlus, Users } from "lucide-react"

import { FiveMonthBarChart } from "@/components/FiveMonthBarChart"
import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import {
  currencyFormatter,
  type OwnerOverviewPageProps,
} from "@/lib/owner-overview"

import { EquipmentOverviewCard } from "./EquipmentOverviewCard"
import { FacilityDistributionCard } from "./FacilityDistributionCard"
import { MembershipTypesCard } from "./MembershipTypesCard"
import { RevenueOverview } from "./RevenueOverview"

const averageMonthlyIcons = [DollarSign, UserPlus, BadgeCheck] as const

export function OwnerOverviewPage({
  totalRevenue,
  previousRevenue,
  revenueChange,
  revenueGrowth,
  periodLabel,
  totalMembers,
  memberGrowth,
  monthlyRevenue,
  monthlyRevenueGrowth,
  revenueByMonth,
  membersByMonth,
  averageMonthlyMetrics,
  facilityDistribution,
  membershipTypes,
  totalActiveMemberships,
  equipmentRooms,
  equipmentStatusCounts,
}: OwnerOverviewPageProps) {
  return (
    <PageShell
      title="Owner Overview"
      description="Revenue, membership activity, facility usage, and operational health."
    >
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] xl:items-end">
        <RevenueOverview
          totalRevenue={totalRevenue}
          previousRevenue={previousRevenue}
          revenueChange={revenueChange}
          growth={revenueGrowth}
          periodLabel={periodLabel}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <SummaryCard
            title="Total Members"
            description="Active members"
            icon={Users}
            value={totalMembers.toLocaleString("en-US")}
            growth={memberGrowth}
          />
          <SummaryCard
            title="Monthly Revenue"
            description="This month"
            icon={DollarSign}
            value={currencyFormatter.format(monthlyRevenue)}
            growth={monthlyRevenueGrowth}
            variant="emphasis"
          />
        </div>
      </section>

      <FacilityDistributionCard
        title="Facility distribution"
        description="Room share across active memberships"
        items={facilityDistribution}
        detailsHref="/facility"
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <MembershipTypesCard
          memberships={membershipTypes}
          totalActive={totalActiveMemberships}
        />
        <FiveMonthBarChart
          title="Revenue by month"
          metricLabel="Revenue"
          valueFormat="currency"
          data={revenueByMonth}
          detailsHref="/revenue"
        />
        <FiveMonthBarChart
          title="Members by month"
          metricLabel="Members"
          data={membersByMonth}
          detailsHref="/members"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EquipmentOverviewCard
          rooms={equipmentRooms}
          statusCounts={equipmentStatusCounts}
        />
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          {averageMonthlyMetrics.map((metric, index) => {
            const Icon = averageMonthlyIcons[index] ?? Activity

            return (
              <SummaryCard
                key={metric.label}
                title={metric.label}
                description={metric.detail ?? "Five-month average"}
                icon={Icon}
                value={metric.value}
              />
            )
          })}
        </div>
      </section>
    </PageShell>
  )
}
