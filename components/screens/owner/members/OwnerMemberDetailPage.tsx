import Link from "next/link"
import {
  CalendarClock,
  CreditCard,
  DollarSign,
  Dumbbell,
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
import { SummaryCard } from "@/components/SummaryCard"
import { StatusBadge } from "@/components/StatusBadge"
import { getScheduleSessionStatus } from "@/lib/features/shared/schedule/utils"
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

function canCancelPlan(subscription: MemberDetailSubscription | null) {
  return (
    subscription?.status === "active" ||
    subscription?.status === "pending_payment" ||
    subscription?.status === "pending_pt_setup"
  )
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
  const canCancelCurrentPlan = canDelete && canCancelPlan(currentSubscription)
  const paidRevenue = member ? getPaidRevenue(member) : 0

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
            <SummaryCard
              title="Subscriptions"
              value={member.subscriptions.length}
              description={`${activeSubscriptions} active subscriptions`}
              icon={CreditCard}
            />
            <SummaryCard
              title="Paid revenue"
              value={currencyFormatter.format(paidRevenue)}
              description="Paid membership payments"
              icon={DollarSign}
            />
            <SummaryCard
              title="PT sessions"
              value={member.sessions.length}
              description="Generated training sessions"
              icon={Dumbbell}
            />
            <SummaryCard
              title="Joined"
              value={formatDate(
                currentSubscription?.createdAt ?? member.createdAt
              )}
              description="Earliest available record"
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
                    {member.sessions.slice(0, 8).map((session) => {
                      const status = getScheduleSessionStatus({
                        starts_at: session.startsAt ?? "",
                        status: session.status,
                      })

                      return (
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
                            <StatusBadge status={status} showDot />
                          </TableCell>
                        </TableRow>
                      )
                    })}
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
