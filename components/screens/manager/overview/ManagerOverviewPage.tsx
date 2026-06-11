import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ManagerFacilityHealthCard } from "./ManagerFacilityHealthCard"
import { ManagerOverviewCharts } from "./ManagerOverviewCharts"
import { ManagerOverviewInsightCards } from "./ManagerOverviewInsightCards"
import { ManagerOverviewMetricGrid } from "./ManagerOverviewMetricGrid"
import { ManagerRequestQueueCard } from "./ManagerRequestQueueCard"
import {
  managerOverviewMonthCount,
  managerOverviewRequestPreviewLimit,
} from "@/lib/features/manager/overview/constants"
import { getManagerOverviewData } from "@/lib/features/manager/overview/data"
import {
  countUniqueMembers,
  getActiveStaffCount,
  getEquipmentCounts,
  getMonthBuckets,
  getNewMembersByMonth,
  getRevenueByMonth,
  getStaffRoleCount,
  getSubscriptionStartDate,
  getTopPackages,
  isInRange,
  sumPaymentsInRange,
} from "@/lib/features/manager/overview/utils"

export async function ManagerOverviewPage() {
  const {
    errorMessages,
    subscriptions,
    payments,
    equipments,
    staffs,
    pts,
    facilities,
    rooms,
    feedbacks,
  } = await getManagerOverviewData()
  const monthBuckets = getMonthBuckets(managerOverviewMonthCount)
  const currentMonth = monthBuckets[monthBuckets.length - 1]
  const paidPayments = payments.filter((payment) => payment.status === "paid")
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === "active"
  )
  const pendingRequests = subscriptions.filter(
    (subscription) =>
      subscription.status === "pending_payment" ||
      subscription.status === "pending_pt_setup"
  )
  const activeMembers = countUniqueMembers(activeSubscriptions)
  const newMembersThisMonth = countUniqueMembers(
    subscriptions.filter((subscription) =>
      isInRange(
        getSubscriptionStartDate(subscription),
        currentMonth.start,
        currentMonth.end
      )
    )
  )
  const monthlyRevenue = sumPaymentsInRange(
    paidPayments,
    currentMonth.start,
    currentMonth.end
  )
  const equipmentIssueCount = equipments.filter(
    (equipment) =>
      equipment.status === "maintenance" || equipment.status === "broken"
  ).length
  const uniquePtCount = new Set(pts.map((pt) => pt.pt_id)).size
  const unansweredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.manager_response === null ||
      feedback.status === "open" ||
      feedback.status === "in_review"
  )

  return (
    <PageShell
      eyebrow="Manager"
      title="Manager Overview"
      description="Daily operational snapshot for members, requests, facility health, and feedback."
    >
      {errorMessages.length ? (
        <Alert variant="destructive">
          <AlertTitle>Overview data could not be fully loaded</AlertTitle>
          <AlertDescription>{errorMessages.join("; ")}</AlertDescription>
        </Alert>
      ) : null}

      <ManagerOverviewMetricGrid
        activeMembers={activeMembers}
        equipmentIssueCount={equipmentIssueCount}
        monthlyRevenue={monthlyRevenue}
        newMembersThisMonth={newMembersThisMonth}
        pendingRequestCount={pendingRequests.length}
      />

      <ManagerOverviewCharts
        memberData={getNewMembersByMonth(subscriptions, monthBuckets)}
        revenueData={getRevenueByMonth(paidPayments, monthBuckets)}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <ManagerRequestQueueCard
          requests={pendingRequests.slice(0, managerOverviewRequestPreviewLimit)}
        />
        <ManagerFacilityHealthCard
          activeStaffCount={getActiveStaffCount(staffs, uniquePtCount)}
          equipmentCounts={getEquipmentCounts(equipments)}
          equipmentTotal={equipments.length}
          facilityCount={facilities.length}
          roomCount={rooms.length}
        />
      </section>

      <ManagerOverviewInsightCards
        activeSubscriptionCount={activeSubscriptions.length}
        staffCount={staffs.length}
        staffRoleCount={getStaffRoleCount(staffs, uniquePtCount)}
        topPackages={getTopPackages(activeSubscriptions)}
        unansweredFeedbacks={unansweredFeedbacks}
        uniquePtCount={uniquePtCount}
      />
    </PageShell>
  )
}
