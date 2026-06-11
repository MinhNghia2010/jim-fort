import Link from "next/link"
import {
  CalendarClock,
  CreditCard,
  DollarSign,
  Dumbbell,
  History,
  Pencil,
  Phone,
  SearchX,
  UserRound,
} from "lucide-react"

import {
  getMemberDetailData,
  type MemberDetailData,
  type MemberDetailSubscription,
} from "@/app/(main)/members/data"
import { cancelMemberPlan } from "@/app/(main)/members/actions"
import { DeleteConfirmationButton } from "@/components/DeleteConfirmationButton"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { StatusBadge } from "@/components/StatusBadge"
import { isPastOrCurrentActivityDate } from "@/lib/features/shared/activity-history"
import { isCancellablePlanStatus } from "@/lib/features/owner/members/cancel-plan"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OwnerMemberDetailPageProps {
  memberId: string
  viewerLabel?: string
  showSessionsLink?: boolean
  canEdit?: boolean
  canDelete?: boolean
}

const statusLabels = {
  pending_pt_setup: "Pending PT setup",
  pending_payment: "Pending payment",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
} as const

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

function formatDateTime(value: string | null) {
  return value ? dateTimeFormatter.format(new Date(value)) : "Not recorded"
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M"
  )
}

function getPaidRevenue(member: MemberDetailData) {
  return member.subscriptions.reduce(
    (total, subscription) =>
      total +
      subscription.payments
        .filter((payment) => payment.status === "paid")
        .reduce((subtotal, payment) => subtotal + payment.amount, 0),
    0
  )
}

function getCurrentSubscription(subscriptions: MemberDetailSubscription[]) {
  return (
    subscriptions.find((subscription) => subscription.status === "active") ??
    subscriptions[0] ??
    null
  )
}

type MemberActivity = {
  id: string
  title: string
  detail: string
  at: string
}

function addActivity(
  activities: MemberActivity[],
  activity: MemberActivity | null
) {
  if (activity?.at) {
    activities.push(activity)
  }
}

function getMemberActivity(member: MemberDetailData, now = new Date()) {
  const activities: MemberActivity[] = []

  addActivity(
    activities,
    member.createdAt
      ? {
          id: "member-created",
          title: "Member profile created",
          detail: member.name,
          at: member.createdAt,
        }
      : null
  )
  addActivity(
    activities,
    member.updatedAt
      ? {
          id: "member-updated",
          title: "Member profile updated",
          detail: member.name,
          at: member.updatedAt,
        }
      : null
  )

  member.subscriptions.forEach((subscription) => {
    addActivity(activities, {
      id: `${subscription.id}-created`,
      title: "Subscription created",
      detail: `${subscription.plan} · ${statusLabels[subscription.status]}`,
      at: subscription.createdAt,
    })
    addActivity(
      activities,
      subscription.activatedAt
        ? {
            id: `${subscription.id}-activated`,
            title: "Subscription activated",
            detail: subscription.plan,
            at: subscription.activatedAt,
          }
        : null
    )
    addActivity(
      activities,
      subscription.cancelledAt
        ? {
            id: `${subscription.id}-cancelled`,
            title: "Subscription cancelled",
            detail: subscription.cancelledReason ?? subscription.plan,
            at: subscription.cancelledAt,
          }
        : null
    )

    subscription.payments.forEach((payment) => {
      const paymentAt = payment.paidAt ?? payment.createdAt

      addActivity(
        activities,
        paymentAt
          ? {
              id: `${subscription.id}-${payment.id}`,
              title: `Payment ${payment.status}`,
              detail: `${subscription.plan} · ${currencyFormatter.format(payment.amount)}`,
              at: paymentAt,
            }
          : null
      )
    })
  })

  member.sessions.forEach((session) => {
    addActivity(
      activities,
      session.startsAt
        ? {
            id: `session-${session.id}`,
            title: `PT session ${session.status}`,
            detail: `${session.trainerName} · #${session.sessionNumber ?? "-"}`,
            at: session.startsAt,
          }
        : null
    )
  })

  return activities
    .filter((activity) => isPastOrCurrentActivityDate(activity.at, now))
    .sort((first, second) => second.at.localeCompare(first.at))
    .slice(0, 12)
}

function MemberNotFound() {
  return (
    <PageShell
      backHref="/members"
      title="Member not found"
      description="This member record is not available from your workspace."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching member
          </CardTitle>
          <CardDescription>
            No accessible member record matched this request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/members">Return to members</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerMemberDetailPage({
  memberId,
  viewerLabel = "Member directory",
  showSessionsLink = false,
  canEdit = true,
  canDelete = true,
}: OwnerMemberDetailPageProps) {
  let member = null
  let loadError: string | null = null

  try {
    member = await getMemberDetailData(memberId)
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load member"
  }

  if (!member && !loadError) {
    return <MemberNotFound />
  }

  const currentSubscription = member
    ? getCurrentSubscription(member.subscriptions)
    : null
  const activeSubscriptions =
    member?.subscriptions.filter(
      (subscription) => subscription.status === "active"
    ).length ?? 0
  const canCancelCurrentPlan =
    canDelete && isCancellablePlanStatus(currentSubscription?.status)
  const paidRevenue = member ? getPaidRevenue(member) : 0
  const memberActivity = member ? getMemberActivity(member) : []

  return (
    <PageShell
      backHref="/members"
      eyebrow={viewerLabel}
      title={member?.name ?? "Member detail"}
      description="Review contact details, subscription history, payments, and PT sessions."
    >
      {loadError ? (
        <Alert variant="destructive">
          <AlertTitle>Member could not be loaded</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
        </Alert>
      ) : null}

      {member ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ManagementMetricCard
              title="Subscriptions"
              value={member.subscriptions.length}
              detail={`${activeSubscriptions} active subscriptions`}
              icon={CreditCard}
            />
            <ManagementMetricCard
              title="Paid revenue"
              value={currencyFormatter.format(paidRevenue)}
              detail="Paid membership payments"
              icon={DollarSign}
            />
            <ManagementMetricCard
              title="PT sessions"
              value={member.sessions.length}
              detail="Generated training sessions"
              icon={Dumbbell}
            />
            <ManagementMetricCard
              title="Joined"
              value={formatDate(
                currentSubscription?.createdAt ?? member.createdAt
              )}
              detail="Earliest available record"
              icon={CalendarClock}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
            <Card>
              <CardHeader className="border-b">
                <div className="flex items-center gap-4">
                  <Avatar className="size-16">
                    {member.avatarUrl ? (
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                    ) : null}
                    <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <CardTitle className="break-words">{member.name}</CardTitle>
                    <CardDescription>
                      {member.phone ?? "No phone number"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Phone
                  </p>
                  <p className="text-sm break-words">
                    {member.phone ?? "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Current plan
                  </p>
                  <p className="text-sm break-words">
                    {currentSubscription?.plan ?? "No subscription"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Current status
                  </p>
                  {currentSubscription ? (
                    <StatusBadge status={currentSubscription.status} showDot>
                      {statusLabels[currentSubscription.status]}
                    </StatusBadge>
                  ) : (
                    <p className="text-sm text-muted-foreground">No status</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Profile updated
                  </p>
                  <p className="text-sm">{formatDate(member.updatedAt)}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="size-5 text-muted-foreground" />
                  Contact summary
                </CardTitle>
                <CardDescription>
                  Contact details for support and staff lookup.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Name</span>
                  <span className="text-right font-medium">{member.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Phone</span>
                  <span className="text-right">
                    {member.phone ?? "Not recorded"}
                  </span>
                </div>
                {showSessionsLink ? (
                  <Button asChild className="mt-2">
                    <Link href={`/members/${member.id}/sessions`}>
                      View sessions
                    </Link>
                  </Button>
                ) : null}
                {canEdit ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/members/${member.id}/edit`}>
                      <Pencil data-icon="inline-start" />
                      Edit
                    </Link>
                  </Button>
                ) : null}
                {canCancelCurrentPlan ? (
                  <DeleteConfirmationButton
                    action={cancelMemberPlan}
                    confirmLabel="Cancel plan"
                    description={`Cancel ${member.name}'s current plan? This keeps the member account and history, but cancels active or pending subscriptions, pending payments, and future scheduled PT sessions.`}
                    inputName="memberId"
                    inputValue={member.id}
                    label="Cancel plan"
                    successMessage="Plan cancelled"
                    title="Cancel member plan?"
                  />
                ) : null}
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle className="flex items-center gap-2">
                <History className="size-5 text-muted-foreground" />
                Activity history
              </CardTitle>
              <CardDescription>
                Recent profile, subscription, payment, and session lifecycle
                events.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {memberActivity.length ? (
                <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="h-12 pl-6">Event</TableHead>
                      <TableHead className="h-12">Detail</TableHead>
                      <TableHead className="h-12 pr-6">When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberActivity.map((activity) => (
                      <TableRow key={activity.id} className="h-[4.5rem]">
                        <TableCell className="pl-6 font-medium">
                          {activity.title}
                        </TableCell>
                        <TableCell>{activity.detail}</TableCell>
                        <TableCell className="pr-6 font-mono text-xs whitespace-nowrap text-muted-foreground">
                          {formatDateTime(activity.at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="min-h-48">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <History />
                    </EmptyMedia>
                    <EmptyTitle>No activity yet</EmptyTitle>
                    <EmptyDescription>
                      Lifecycle events will appear as this member uses the app.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Subscription history</CardTitle>
              <CardDescription>
                Showing {member.subscriptions.length} subscription records.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {member.subscriptions.length ? (
                <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="h-12 pl-6">Plan</TableHead>
                      <TableHead className="h-12">Facility</TableHead>
                      <TableHead className="h-12">Status</TableHead>
                      <TableHead className="h-12">Price</TableHead>
                      <TableHead className="h-12">Expires</TableHead>
                      <TableHead className="h-12 pr-6">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.subscriptions.map((subscription) => (
                      <TableRow key={subscription.id} className="h-[4.5rem]">
                        <TableCell className="pl-6">
                          <p className="font-medium break-words">
                            {subscription.plan}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {subscription.hasPt
                              ? `${subscription.sessionCount ?? 0} PT sessions`
                              : `${subscription.durationDays ?? 0} access days`}
                          </p>
                        </TableCell>
                        <TableCell>{subscription.facilityName}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <StatusBadge status={subscription.status} showDot>
                            {statusLabels[subscription.status]}
                          </StatusBadge>
                        </TableCell>
                        <TableCell className="font-medium whitespace-nowrap tabular-nums">
                          {currencyFormatter.format(subscription.finalPrice)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(subscription.expiresAt)}
                        </TableCell>
                        <TableCell className="pr-6 whitespace-nowrap text-muted-foreground">
                          {formatDate(subscription.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="min-h-64">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <UserRound />
                    </EmptyMedia>
                    <EmptyTitle>No subscriptions</EmptyTitle>
                    <EmptyDescription>
                      This member does not have an accessible subscription.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>PT sessions</CardTitle>
              <CardDescription>
                Latest generated sessions connected to this member.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {member.sessions.length ? (
                <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="h-12 pl-6">Session</TableHead>
                      <TableHead className="h-12">Trainer</TableHead>
                      <TableHead className="h-12">Starts</TableHead>
                      <TableHead className="h-12">Ends</TableHead>
                      <TableHead className="h-12 pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {member.sessions.slice(0, 8).map((session) => (
                      <TableRow key={session.id} className="h-[4.5rem]">
                        <TableCell className="pl-6 font-medium">
                          #{session.sessionNumber ?? "-"}
                        </TableCell>
                        <TableCell>{session.trainerName}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(session.startsAt)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDateTime(session.endsAt)}
                        </TableCell>
                        <TableCell className="pr-6 whitespace-nowrap">
                          <StatusBadge status={session.status} showDot />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty className="min-h-64">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Dumbbell />
                    </EmptyMedia>
                    <EmptyTitle>No PT sessions</EmptyTitle>
                    <EmptyDescription>
                      PT sessions appear after a PT subscription is activated.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </PageShell>
  )
}
