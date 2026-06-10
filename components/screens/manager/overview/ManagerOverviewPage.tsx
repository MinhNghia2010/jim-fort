import Link from "next/link"
import {
  ClipboardList,
  DollarSign,
  Dumbbell,
  MessageSquareWarning,
  Users,
} from "lucide-react"

import { FiveMonthBarChart } from "@/components/FiveMonthBarChart"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { StatusBadge } from "@/components/StatusBadge"
import { TableActionButton } from "@/components/TableActionButton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  currencyFormatter,
  equipmentStatuses,
  formatUtcMonthKey,
  monthFormatter,
  type EquipmentStatus,
  type MonthlyMetric,
} from "@/lib/owner-overview"
import { createClient } from "@/lib/supabase/server"

type UserRelation = {
  full_name: string | null
  phone?: string | null
}

type PackageRelation = {
  name: string | null
}

type SubscriptionRecord = {
  id: string
  member_id: string
  package_id: string
  status: string
  final_price: number | string | null
  activated_at: string | null
  created_at: string
  users: UserRelation | UserRelation[] | null
  membership_packages: PackageRelation | PackageRelation[] | null
}

type PaymentRecord = {
  amount: number | string
  status: string
  paid_at: string | null
  created_at: string
}

type EquipmentRecord = {
  id: string
  name: string
  status: EquipmentStatus
}

type StaffRecord = {
  id: string
  status: string
  role: string | null
}

type FacilityPtRecord = {
  pt_id: string
}

type FeedbackRecord = {
  id: string
  subject: string
  status: string
  rating: number | null
  manager_response: string | null
  created_at: string
  member: UserRelation | UserRelation[] | null
}

type FacilityRecord = {
  id: string
}

type RoomRecord = {
  id: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh",
})

const requestPreviewLimit = 3

function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function addUtcMonths(date: Date, amount: number) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1)
  )
}

function getMonthBuckets(count: number, anchor = new Date()) {
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

function getDate(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? null : date
}

function isInRange(date: Date | null, start: Date, end: Date) {
  return date !== null && date >= start && date < end
}

function toNumber(value: number | string | null | undefined) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

function getSubscriptionStartDate(subscription: SubscriptionRecord) {
  return getDate(subscription.activated_at) ?? getDate(subscription.created_at)
}

function countUniqueMembers(subscriptions: readonly SubscriptionRecord[]) {
  return new Set(subscriptions.map((subscription) => subscription.member_id))
    .size
}

function sumPaymentsInRange(
  payments: readonly PaymentRecord[],
  start: Date,
  end: Date
) {
  return payments.reduce((sum, payment) => {
    const paidAt = getDate(payment.paid_at ?? payment.created_at)

    if (!isInRange(paidAt, start, end)) {
      return sum
    }

    return sum + toNumber(payment.amount)
  }, 0)
}

function getRevenueByMonth(
  payments: readonly PaymentRecord[],
  monthBuckets: ReturnType<typeof getMonthBuckets>
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => ({
    month: bucket.month,
    monthKey: bucket.monthKey,
    value: sumPaymentsInRange(payments, bucket.start, bucket.end),
  }))
}

function getNewMembersByMonth(
  subscriptions: readonly SubscriptionRecord[],
  monthBuckets: ReturnType<typeof getMonthBuckets>
): MonthlyMetric[] {
  return monthBuckets.map((bucket) => {
    const memberIds = new Set<string>()

    subscriptions.forEach((subscription) => {
      if (
        isInRange(
          getSubscriptionStartDate(subscription),
          bucket.start,
          bucket.end
        )
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

function formatPercent(count: number, total: number) {
  if (total === 0) {
    return 0
  }

  return Math.round((count / total) * 100)
}

function getPackageName(subscription: SubscriptionRecord) {
  return (
    getSingleRelation(subscription.membership_packages)?.name?.trim() ||
    "Membership"
  )
}

function getMemberName(subscription: SubscriptionRecord) {
  return getSingleRelation(subscription.users)?.full_name?.trim() || "Member"
}

function getFeedbackMemberName(feedback: FeedbackRecord) {
  return getSingleRelation(feedback.member)?.full_name?.trim() || "Member"
}

async function getManagerOverviewData() {
  const supabase = await createClient()
  const [
    subscriptionsResult,
    paymentsResult,
    equipmentResult,
    staffsResult,
    ptsResult,
    facilitiesResult,
    roomsResult,
    feedbackResult,
  ] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select(
        "id, member_id, package_id, status, final_price, activated_at, created_at, users:member_id(full_name, phone), membership_packages(name)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("membership_payments")
      .select("amount, status, paid_at, created_at")
      .eq("status", "paid"),
    supabase.from("gym_equipments").select("id, name, status"),
    supabase.from("staffs").select("id, status, role"),
    supabase.from("facility_pts").select("pt_id"),
    supabase.from("gym_facilities").select("id"),
    supabase.from("rooms").select("id"),
    supabase
      .from("facility_feedbacks")
      .select(
        "id, subject, status, rating, manager_response, created_at, member:users!facility_feedbacks_member_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false }),
  ])

  const errorMessages = [
    subscriptionsResult.error,
    paymentsResult.error,
    equipmentResult.error,
    staffsResult.error,
    ptsResult.error,
    facilitiesResult.error,
    roomsResult.error,
    feedbackResult.error,
  ].flatMap((error) => (error ? [error.message] : []))

  return {
    errorMessages,
    subscriptions: (subscriptionsResult.data ??
      []) as unknown as SubscriptionRecord[],
    payments: (paymentsResult.data ?? []) as unknown as PaymentRecord[],
    equipments: (equipmentResult.data ?? []) as unknown as EquipmentRecord[],
    staffs: (staffsResult.data ?? []) as unknown as StaffRecord[],
    pts: (ptsResult.data ?? []) as unknown as FacilityPtRecord[],
    facilities: (facilitiesResult.data ?? []) as unknown as FacilityRecord[],
    rooms: (roomsResult.data ?? []) as unknown as RoomRecord[],
    feedbacks: (feedbackResult.data ?? []) as unknown as FeedbackRecord[],
  }
}

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
  const monthBuckets = getMonthBuckets(5)
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
  const latestPendingRequests = pendingRequests.slice(0, requestPreviewLimit)
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
  const activeStaffCount =
    staffs.filter((staff) => staff.status === "active").length + uniquePtCount
  const staffRoleCount = new Set([
    ...staffs.flatMap((staff) => (staff.role ? [staff.role] : [])),
    ...(uniquePtCount ? ["pt"] : []),
  ]).size
  const unansweredFeedbacks = feedbacks.filter(
    (feedback) =>
      feedback.manager_response === null ||
      feedback.status === "open" ||
      feedback.status === "in_review"
  )
  const packageCounts = new Map<string, number>()

  activeSubscriptions.forEach((subscription) => {
    const packageName = getPackageName(subscription)
    packageCounts.set(packageName, (packageCounts.get(packageName) ?? 0) + 1)
  })

  const topPackages = Array.from(packageCounts.entries())
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .slice(0, 5)
  const equipmentCounts = equipmentStatuses.map((status) => ({
    status,
    count: equipments.filter((equipment) => equipment.status === status).length,
  }))

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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Active members"
          value={activeMembers}
          detail={`${newMembersThisMonth} new this month`}
          icon={Users}
        />
        <ManagementMetricCard
          title="Pending requests"
          value={pendingRequests.length}
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

      <section className="grid gap-4 lg:grid-cols-2">
        <FiveMonthBarChart
          title="Revenue by month"
          description="Managed facilities"
          metricLabel="Revenue"
          valueFormat="currency"
          data={getRevenueByMonth(paidPayments, monthBuckets)}
          detailsHref="/revenue"
        />
        <FiveMonthBarChart
          title="New members by month"
          description="Managed facilities"
          metricLabel="Members"
          data={getNewMembersByMonth(subscriptions, monthBuckets)}
          detailsHref="/members"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Request queue</CardTitle>
            <CardDescription>
              Latest payment and PT setup requests requiring manager attention.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {latestPendingRequests.length} latest
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {latestPendingRequests.length ? (
              <>
                <div className="flex flex-col md:hidden">
                  {latestPendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium break-words">
                            {getMemberName(request)}
                          </p>
                          <p className="text-sm break-words text-muted-foreground">
                            {getPackageName(request)}
                          </p>
                        </div>
                        <TableActionButton
                          asChild
                          tone="view"
                          className="min-w-16"
                        >
                          <Link href={`/request/${request.id}`}>Open</Link>
                        </TableActionButton>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={request.status} showDot />
                        <span className="rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                          {dateFormatter.format(new Date(request.created_at))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <Table className="hidden min-w-[780px] table-fixed text-[0.925rem] md:table [&_td]:whitespace-normal [&_th]:whitespace-normal">
                  <colgroup>
                    <col className="w-[30%]" />
                    <col className="w-[26%]" />
                    <col className="w-[18%]" />
                    <col className="w-[12%]" />
                    <col className="w-[14%]" />
                  </colgroup>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="h-12 pl-6">Member</TableHead>
                      <TableHead className="h-12">Package</TableHead>
                      <TableHead className="h-12">Status</TableHead>
                      <TableHead className="h-12">Created</TableHead>
                      <TableHead className="h-12 pr-6 text-right">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {latestPendingRequests.map((request) => (
                      <TableRow key={request.id} className="h-[4.5rem]">
                        <TableCell className="pl-6 font-medium">
                          {getMemberName(request)}
                        </TableCell>
                        <TableCell>{getPackageName(request)}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge status={request.status} showDot />
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {dateFormatter.format(new Date(request.created_at))}
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <TableActionButton asChild tone="view">
                            <Link href={`/request/${request.id}`}>Open</Link>
                          </TableActionButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            ) : (
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <ClipboardList />
                  </EmptyMedia>
                  <EmptyTitle>No pending requests</EmptyTitle>
                  <EmptyDescription>
                    New payment and PT setup requests will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Facility health</CardTitle>
            <CardDescription>
              Coverage and equipment status across managed facilities.
            </CardDescription>
            <CardAction>
              <TableActionButton asChild tone="view">
                <Link href="/facility">Details</Link>
              </TableActionButton>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Facilities</p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {facilities.length}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Rooms</p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {rooms.length}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Active staff</p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {activeStaffCount}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-5 py-2">
              {equipmentCounts.map((equipment) => (
                <div
                  key={equipment.status}
                  className="grid grid-cols-[minmax(9rem,auto)_minmax(0,1fr)_3rem] items-center gap-6"
                >
                  <StatusBadge status={equipment.status} showDot />
                  <Progress
                    value={formatPercent(equipment.count, equipments.length)}
                    aria-label={`${equipment.status} equipment share`}
                  />
                  <span className="text-right font-mono text-sm text-muted-foreground tabular-nums">
                    {equipment.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Membership mix</CardTitle>
            <CardDescription>
              Top active plans in managed facilities.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {topPackages.length ? (
              topPackages.map(([packageName, count]) => (
                <div key={packageName} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium break-words">
                      {packageName}
                    </p>
                    <span className="font-mono text-sm text-muted-foreground tabular-nums">
                      {count}
                    </span>
                  </div>
                  <Progress
                    value={formatPercent(count, activeSubscriptions.length)}
                    aria-label={`${packageName} active subscription share`}
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Active membership plans will appear here.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team coverage</CardTitle>
            <CardDescription>
              Staff and trainer coverage for operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Facility staff</p>
                <p className="text-xs text-muted-foreground">
                  Non-PT operational staff
                </p>
              </div>
              <span className="font-heading text-xl font-semibold tabular-nums">
                {staffs.length}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Assigned PTs</p>
                <p className="text-xs text-muted-foreground">
                  Trainer login accounts
                </p>
              </div>
              <span className="font-heading text-xl font-semibold tabular-nums">
                {uniquePtCount}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">Role types</p>
                <p className="text-xs text-muted-foreground">
                  Coverage categories
                </p>
              </div>
              <span className="font-heading text-xl font-semibold tabular-nums">
                {staffRoleCount}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Feedback waiting</CardTitle>
            <CardDescription>
              Newest feedback without a settled response.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">
                {unansweredFeedbacks.length} waiting
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {unansweredFeedbacks.length ? (
              <div className="flex flex-col">
                {unansweredFeedbacks.slice(0, 4).map((feedback) => (
                  <div
                    key={feedback.id}
                    className="flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {feedback.subject}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {getFeedbackMemberName(feedback)} ·{" "}
                        {dateFormatter.format(new Date(feedback.created_at))}
                      </p>
                    </div>
                    <TableActionButton asChild tone="feedback">
                      <Link href={`/feedback/${feedback.id}`}>Review</Link>
                    </TableActionButton>
                  </div>
                ))}
              </div>
            ) : (
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MessageSquareWarning />
                  </EmptyMedia>
                  <EmptyTitle>No feedback waiting</EmptyTitle>
                  <EmptyDescription>
                    Open feedback that needs a response will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}
