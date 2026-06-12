"use client"

import { useMemo, useState } from "react"
import { CircleDollarSign, Dumbbell, UserRound, Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import { OwnerMembershipsTable } from "@/components/screens/owner/memberships/OwnerMembershipsTable"
import type {
  FacilityFilterOption,
  MembershipMonthSummary,
  MembershipPlanView,
  OwnerMembershipsPageProps,
} from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterLabel,
  getTableMonthKey,
  type TableMonthFilterOption,
} from "@/components/TableMonthFilter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ALL_FACILITIES_VALUE = "all"

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

function filterPlansByFacility(
  plans: readonly MembershipPlanView[],
  facilityFilter: string
) {
  if (facilityFilter === ALL_FACILITIES_VALUE) {
    return plans
  }

  return plans.filter((plan) => plan.facilityId === facilityFilter)
}

function computeFacilityStats(plans: readonly MembershipPlanView[]) {
  let activeMembers = 0
  let ptMembers = 0
  let nonPtMembers = 0
  const activeMemberIds = new Set<string>()
  const ptMemberIds = new Set<string>()
  const nonPtMemberIds = new Set<string>()

  for (const plan of plans) {
    activeMembers += plan.activeMembers
  }

  return { activeMembers }
}

export function OwnerMembershipsClientContent({
  facilityLabel,
  facilityFilterOptions,
  plans,
  monthlySummaries,
  activeMembers,
  ptMembers,
  nonPtMembers,
  activeMembersDetail,
  revenueThisMonth,
  revenueDetail,
  errorMessage,
  canManage = true,
}: OwnerMembershipsPageProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const [facilityFilter, setFacilityFilter] = useState(ALL_FACILITIES_VALUE)
  const hasMultipleFacilities = facilityFilterOptions.length > 2
  const facilityFilteredPlans = useMemo(
    () => filterPlansByFacility(plans, facilityFilter),
    [plans, facilityFilter]
  )
  const selectedSummary = monthlySummaries.find(
    (summary) => summary.monthKey === monthFilter
  )
  const isAllMonths = monthFilter === ALL_MONTHS_VALUE
  const isAllFacilities = facilityFilter === ALL_FACILITIES_VALUE
  const monthFilterOptions = useMemo(
    () => getMonthFilterOptions(monthlySummaries),
    [monthlySummaries]
  )
  const displayedPlans = useMemo(
    () => getPlansForMonth(facilityFilteredPlans, monthFilter),
    [facilityFilteredPlans, monthFilter]
  )

  const facilityActiveMembers = isAllFacilities
    ? activeMembers
    : facilityFilteredPlans.reduce(
        (total, plan) => total + plan.activeMembers,
        0
      )

  const selectedFacilityLabel =
    facilityFilterOptions.find((option) => option.value === facilityFilter)
      ?.label ?? facilityLabel

  const selectedMonthLabel = selectedSummary?.monthLabel ?? "selected month"
  const currentMonthKey =
    getTableMonthKey(new Date().toISOString()) ?? ALL_MONTHS_VALUE
  const currentMonthLabel = getTableMonthFilterLabel(
    currentMonthKey,
    "This month"
  )
  const selectedSnapshotDescription =
    monthFilter === currentMonthKey
      ? "Current active membership snapshot"
      : `Active at the end of ${selectedMonthLabel}`
  const currentSummary = monthlySummaries.find(
    (summary) => summary.monthKey === currentMonthKey
  )
  const activationSummary = isAllMonths ? currentSummary : selectedSummary
  const activationMonthLabel = isAllMonths
    ? currentMonthLabel
    : selectedMonthLabel
  const activeMembersDescription = isAllMonths
    ? activeMembersDetail.replace("this month", `in ${currentMonthLabel}`)
    : selectedSnapshotDescription
  const revenueDescription = isAllMonths
    ? revenueDetail.replace("this month", `in ${currentMonthLabel}`)
    : `${selectedSummary?.paymentCount ?? 0} paid payments in ${selectedMonthLabel}`
  const getActivationDescription = (count: number) =>
    `${count} ${count === 1 ? "activation" : "activations"} in ${activationMonthLabel}`

  return (
    <PageShell
      eyebrow={isAllFacilities ? facilityLabel : selectedFacilityLabel}
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active members"
          value={
            isAllMonths
              ? facilityActiveMembers
              : (selectedSummary?.activeMembers ?? 0)
          }
          description={activeMembersDescription}
          icon={Users}
        />
        <SummaryCard
          title="PT members"
          value={isAllMonths ? ptMembers : (selectedSummary?.ptMembers ?? 0)}
          description={getActivationDescription(
            activationSummary?.ptActivations ?? 0
          )}
          icon={Dumbbell}
        />
        <SummaryCard
          title="Non-PT members"
          value={
            isAllMonths ? nonPtMembers : (selectedSummary?.nonPtMembers ?? 0)
          }
          description={getActivationDescription(
            activationSummary?.nonPtActivations ?? 0
          )}
          icon={UserRound}
        />
        <SummaryCard
          title={isAllMonths ? "Paid revenue this month" : "Paid revenue"}
          value={
            isAllMonths
              ? revenueThisMonth
              : currencyFormatter.format(selectedSummary?.revenue ?? 0)
          }
          description={revenueDescription}
          icon={CircleDollarSign}
        />
      </div>

      <OwnerMembershipsTable
        plans={displayedPlans}
        canManage={canManage}
        monthFilter={monthFilter}
        monthFilterOptions={monthFilterOptions}
        onMonthFilterChange={setMonthFilter}
        facilityFilter={facilityFilter}
        facilityFilterOptions={facilityFilterOptions}
        onFacilityFilterChange={setFacilityFilter}
        showFacilityColumn={hasMultipleFacilities}
      />
    </PageShell>
  )
}
