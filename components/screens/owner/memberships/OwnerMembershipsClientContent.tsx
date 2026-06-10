"use client"

import { useMemo, useState } from "react"
import { CircleDollarSign, Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerMembershipsTable } from "@/components/screens/owner/memberships/OwnerMembershipsTable"
import type {
  MembershipMonthSummary,
  MembershipPlanView,
  OwnerMembershipsPageProps,
} from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import {
  ALL_MONTHS_VALUE,
  type TableMonthFilterOption,
} from "@/components/TableMonthFilter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function getPlansForMonth(
  plans: readonly MembershipPlanView[],
  monthFilter: string
) {
  if (monthFilter === ALL_MONTHS_VALUE) {
    return plans
  }

  return plans.map((plan) => {
    const stats = plan.monthlyStats.find(
      (monthStats) => monthStats.monthKey === monthFilter
    )

    return {
      ...plan,
      activeMembers: stats?.activeMembers ?? 0,
      revenueLabel: currencyFormatter.format(stats?.revenue ?? 0),
    }
  })
}

function getMonthFilterOptions(
  monthlySummaries: readonly MembershipMonthSummary[]
): TableMonthFilterOption[] {
  return [
    { value: ALL_MONTHS_VALUE, label: "All months" },
    ...monthlySummaries.map((summary) => ({
      value: summary.monthKey,
      label: summary.monthLabel,
    })),
  ]
}

export function OwnerMembershipsClientContent({
  facilityLabel,
  plans,
  monthlySummaries,
  activeMembers,
  activeMembersDetail,
  revenueThisMonth,
  revenueDetail,
  errorMessage,
  canManage = true,
}: OwnerMembershipsPageProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const selectedSummary = monthlySummaries.find(
    (summary) => summary.monthKey === monthFilter
  )
  const isAllMonths = monthFilter === ALL_MONTHS_VALUE
  const monthFilterOptions = useMemo(
    () => getMonthFilterOptions(monthlySummaries),
    [monthlySummaries]
  )
  const displayedPlans = useMemo(
    () => getPlansForMonth(plans, monthFilter),
    [plans, monthFilter]
  )
  const selectedMonthLabel = selectedSummary?.monthLabel ?? "selected month"

  return (
    <PageShell
      eyebrow={facilityLabel}
      title="Memberships"
      description={
        canManage
          ? "Plans, pricing, active members, and paid package revenue."
          : "Plans, pricing, and paid package revenue."
      }
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Membership data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <ManagementMetricCard
          title={isAllMonths ? "Active members" : "Selected active members"}
          value={isAllMonths ? activeMembers : selectedSummary?.activeMembers ?? 0}
          detail={
            isAllMonths
              ? activeMembersDetail
              : `${selectedSummary?.activations ?? 0} activations in ${selectedMonthLabel}`
          }
          icon={Users}
        />
        <ManagementMetricCard
          title={
            isAllMonths ? "Paid revenue this month" : "Selected month revenue"
          }
          value={
            isAllMonths
              ? revenueThisMonth
              : currencyFormatter.format(selectedSummary?.revenue ?? 0)
          }
          detail={
            isAllMonths
              ? revenueDetail
              : `${selectedSummary?.paymentCount ?? 0} paid payments in ${selectedMonthLabel}`
          }
          icon={CircleDollarSign}
        />
      </div>

      <OwnerMembershipsTable
        plans={displayedPlans}
        canManage={canManage}
        monthFilter={monthFilter}
        monthFilterOptions={monthFilterOptions}
        onMonthFilterChange={setMonthFilter}
      />
    </PageShell>
  )
}
