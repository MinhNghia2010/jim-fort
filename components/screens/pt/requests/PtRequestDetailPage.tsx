import { CalendarClock, ClipboardList, SearchX } from "lucide-react"
import Link from "next/link"

import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

interface PtRequestDetailPageProps {
  requestId: string
}

type AssignmentRow = {
  id: string
  subscription_id: string
  status: string
  schedule_starts_on: string | null
  schedule_timezone: string
  schedule_note: string | null
  member_response_note: string | null
  assigned_at: string
  membership_pt_assignment_schedule_slots:
    | { day_of_week: number; start_time: string; end_time: string }[]
    | null
}

type SubscriptionRow = {
  id: string
  status: string
  users: { full_name: string | null; phone: string | null } | null
  membership_packages: { name: string | null } | null
}

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

function PtRequestNotFound({ requestId }: PtRequestDetailPageProps) {
  return (
    <PageShell
      backHref="/request"
      title="Request not found"
      description="This PT request is not available from your account."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching request
          </CardTitle>
          <CardDescription>
            No accessible request matched{" "}
            <span className="font-mono text-foreground">{requestId}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/request">Return to requests</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function PtRequestDetailPage({
  requestId,
}: PtRequestDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const [assignmentResult, subscriptionResult] = user
    ? await Promise.all([
        supabase
          .from("membership_pt_assignments")
          .select(
            "id, subscription_id, status, schedule_starts_on, schedule_timezone, schedule_note, member_response_note, assigned_at, membership_pt_assignment_schedule_slots(day_of_week, start_time, end_time)"
          )
          .eq("subscription_id", requestId)
          .eq("pt_id", user.id)
          .order("assigned_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("membership_subscriptions")
          .select(
            "id, status, users:member_id(full_name, phone), membership_packages(name)"
          )
          .eq("id", requestId)
          .maybeSingle(),
      ])
    : [
        { data: null, error: null },
        { data: null, error: null },
      ]
  const assignment = assignmentResult.data as unknown as AssignmentRow | null
  const subscription =
    subscriptionResult.data as unknown as SubscriptionRow | null
  const error = assignmentResult.error ?? subscriptionResult.error
  const slots =
    assignment?.membership_pt_assignment_schedule_slots?.sort(
      (first, second) =>
        first.day_of_week - second.day_of_week ||
        first.start_time.localeCompare(second.start_time)
    ) ?? []

  if (!assignment && !error) {
    return <PtRequestNotFound requestId={requestId} />
  }

  return (
    <PageShell
      backHref="/request"
      eyebrow="PT"
      title="PT request detail"
      description="Review the proposed member assignment and schedule."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Request could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {assignment ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader className="border-b">
              <CardTitle>
                {subscription?.users?.full_name ?? "Member"}
              </CardTitle>
              <CardDescription>
                {subscription?.membership_packages?.name ?? "Membership"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Assignment status
                  </p>
                  <StatusBadge status={assignment.status} showDot />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Subscription status
                  </p>
                  <StatusBadge status={subscription?.status} showDot />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Assigned
                  </p>
                  <p className="text-sm">
                    {formatDate(assignment.assigned_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    Starts
                  </p>
                  <p className="text-sm">
                    {formatDate(assignment.schedule_starts_on)}
                  </p>
                </div>
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Manager note
                </p>
                <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {assignment.schedule_note ?? "No note was added."}
                </p>
              </div>
              <div className="grid gap-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Member response
                </p>
                <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                  {assignment.member_response_note ?? "No member response yet."}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-5 text-muted-foreground" />
                Proposed schedule
              </CardTitle>
              <CardDescription>
                Times use {assignment.schedule_timezone}.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {slots.length ? (
                slots.map((slot) => (
                  <div
                    key={`${slot.day_of_week}-${slot.start_time}`}
                    className="rounded-lg border p-3"
                  >
                    <p className="font-medium">{days[slot.day_of_week]}</p>
                    <p className="text-sm text-muted-foreground">
                      {slot.start_time.slice(0, 5)} -{" "}
                      {slot.end_time.slice(0, 5)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                  <ClipboardList className="mb-2 size-5" />
                  No schedule slots were saved.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
