import { MessageSquareWarning } from "lucide-react"

import { TableRowActions } from "@/components/TableRowActions"
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
  managerOverviewDateFormatter,
  managerOverviewFeedbackPreviewLimit,
} from "@/lib/features/manager/overview/constants"
import type { FeedbackRecord } from "@/lib/features/manager/overview/data"
import { formatPercent, getFeedbackMemberName } from "@/lib/features/manager/overview/utils"

type ManagerOverviewInsightCardsProps = {
  activeSubscriptionCount: number
  staffCount: number
  staffRoleCount: number
  topPackages: [string, number][]
  unansweredFeedbacks: FeedbackRecord[]
  uniquePtCount: number
}

export function ManagerOverviewInsightCards({
  activeSubscriptionCount,
  staffCount,
  staffRoleCount,
  topPackages,
  unansweredFeedbacks,
  uniquePtCount,
}: ManagerOverviewInsightCardsProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <MembershipMixCard
        activeSubscriptionCount={activeSubscriptionCount}
        topPackages={topPackages}
      />
      <TeamCoverageCard
        staffCount={staffCount}
        staffRoleCount={staffRoleCount}
        uniquePtCount={uniquePtCount}
      />
      <FeedbackWaitingCard unansweredFeedbacks={unansweredFeedbacks} />
    </section>
  )
}

type MembershipMixCardProps = {
  activeSubscriptionCount: number
  topPackages: [string, number][]
}

function MembershipMixCard({
  activeSubscriptionCount,
  topPackages,
}: MembershipMixCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership mix</CardTitle>
        <CardDescription>Top active plans in managed facilities.</CardDescription>
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
                value={formatPercent(count, activeSubscriptionCount)}
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
  )
}

type TeamCoverageCardProps = {
  staffCount: number
  staffRoleCount: number
  uniquePtCount: number
}

function TeamCoverageCard({
  staffCount,
  staffRoleCount,
  uniquePtCount,
}: TeamCoverageCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team coverage</CardTitle>
        <CardDescription>
          Staff and trainer coverage for operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        <TeamCoverageStat
          detail="Non-PT operational staff"
          label="Facility staff"
          value={staffCount}
        />
        <TeamCoverageStat
          detail="Trainer login accounts"
          label="Assigned PTs"
          value={uniquePtCount}
        />
        <TeamCoverageStat
          detail="Coverage categories"
          label="Role types"
          value={staffRoleCount}
        />
      </CardContent>
    </Card>
  )
}

type TeamCoverageStatProps = {
  detail: string
  label: string
  value: number
}

function TeamCoverageStat({ detail, label, value }: TeamCoverageStatProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <span className="font-heading text-xl font-semibold tabular-nums">
        {value}
      </span>
    </div>
  )
}

type FeedbackWaitingCardProps = {
  unansweredFeedbacks: FeedbackRecord[]
}

function FeedbackWaitingCard({
  unansweredFeedbacks,
}: FeedbackWaitingCardProps) {
  return (
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
            {unansweredFeedbacks
              .slice(0, managerOverviewFeedbackPreviewLimit)
              .map((feedback) => (
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
                      {managerOverviewDateFormatter.format(
                        new Date(feedback.created_at)
                      )}
                    </p>
                  </div>
                  <TableRowActions
                    label={`Open actions for ${feedback.subject}`}
                    actions={[
                      {
                        href: `/feedback/${feedback.id}`,
                        label: "Review",
                      },
                    ]}
                  />
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
  )
}
