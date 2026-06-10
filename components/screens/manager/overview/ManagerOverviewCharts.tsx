import { FiveMonthBarChart } from "@/components/FiveMonthBarChart"
import type { MonthlyMetric } from "@/lib/owner-overview"

type ManagerOverviewChartsProps = {
  memberData: MonthlyMetric[]
  revenueData: MonthlyMetric[]
}

export function ManagerOverviewCharts({
  memberData,
  revenueData,
}: ManagerOverviewChartsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <FiveMonthBarChart
        title="Revenue by month"
        description="Managed facilities"
        metricLabel="Revenue"
        valueFormat="currency"
        data={revenueData}
        detailsHref="/revenue"
      />
      <FiveMonthBarChart
        title="New members by month"
        description="Managed facilities"
        metricLabel="Members"
        data={memberData}
        detailsHref="/members"
      />
    </section>
  )
}
