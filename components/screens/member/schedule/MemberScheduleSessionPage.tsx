import { notFound } from "next/navigation"
import {
  CalendarClock,
  CheckCheck,
  MessageSquareText,
  UserRound,
} from "lucide-react"

import { markSessionFeedbackRead } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getScheduleSessionStatus } from "@/lib/features/shared/schedule/utils"
import { createClient } from "@/lib/supabase/server"

type SessionRow = {
  id: string
  subscription_id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null; phone: string | null } | null
  membership_subscriptions: {
    membership_packages: { name: string | null } | null
    gym_facilities: { name: string | null } | null
  } | null
}

type FeedbackRow = {
  id: string
  feedback: string
  rating: number | null
  next_steps: string | null
  status: string
  sent_at: string
  member_read_at: string | null
  users: { full_name: string | null } | null
}

interface MemberScheduleSessionPageProps {
  sessionId: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "full",
})

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function FeedbackCard({
  feedback,
  sessionId,
}: {
  feedback: FeedbackRow | null
  sessionId: string
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareText className="size-5" />
          PT feedback
        </CardTitle>
        <CardDescription>
          Feedback appears after your trainer sends it.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {feedback ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:flex-col">
              <div>
                <p className="font-medium">
                  {feedback.users?.full_name ?? "Trainer"} feedback
                </p>
                <p className="text-sm text-muted-foreground">
                  Sent {dateTimeFormatter.format(new Date(feedback.sent_at))}
                </p>
              </div>
              <StatusBadge status={feedback.status} showDot />
            </div>

            {feedback.rating ? (
              <div className="rounded-lg border p-3">
                <p className="text-sm text-muted-foreground">Rating</p>
                <p className="font-mono text-2xl font-semibold">
                  {feedback.rating}/5
                </p>
              </div>
            ) : null}

            <div className="grid gap-2">
              <h2 className="font-heading text-lg font-semibold">Feedback</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {feedback.feedback}
              </p>
            </div>

            {feedback.next_steps ? (
              <div className="grid gap-2">
                <h2 className="font-heading text-lg font-semibold">
                  Next steps
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {feedback.next_steps}
                </p>
              </div>
            ) : null}

            {feedback.status !== "read" ? (
              <MemberActionForm
                action={markSessionFeedbackRead}
                submitLabel="Mark as read"
              >
                <input type="hidden" name="sessionId" value={sessionId} />
                <input type="hidden" name="feedbackId" value={feedback.id} />
              </MemberActionForm>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCheck className="size-4" />
                Read{" "}
                {feedback.member_read_at
                  ? dateTimeFormatter.format(new Date(feedback.member_read_at))
                  : ""}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No PT feedback has been sent for this session yet.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

export async function MemberScheduleSessionPage({
  sessionId,
}: MemberScheduleSessionPageProps) {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,subscription_id,session_number,starts_at,ends_at,status,users:pt_id(full_name,phone),membership_subscriptions(membership_packages(name),gym_facilities(name))"
      )
      .eq("id", sessionId)
      .maybeSingle(),
    supabase
      .from("pt_session_feedbacks")
      .select(
        "id,feedback,rating,next_steps,status,sent_at,member_read_at,users:pt_id(full_name)"
      )
      .eq("session_id", sessionId)
      .maybeSingle(),
  ])

  if (!sessionResult.data && !sessionResult.error) {
    notFound()
  }

  const session = sessionResult.data as unknown as SessionRow | null
  const feedback = feedbackResult.data as FeedbackRow | null
  const error = sessionResult.error ?? feedbackResult.error
  const startsAt = session ? new Date(session.starts_at) : null
  const endsAt = session ? new Date(session.ends_at) : null
  const sessionStatus = session ? getScheduleSessionStatus(session) : null

  return (
    <PageShell
      backHref="/schedule"
      eyebrow="Member session"
      title={session ? `Session ${session.session_number}` : "Session"}
      description="Review your generated PT session details and trainer feedback."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Session could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {session && startsAt && endsAt ? (
        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>
                    {session.membership_subscriptions?.membership_packages
                      ?.name ?? "PT package"}
                  </CardTitle>
                  <CardDescription>
                    {session.membership_subscriptions?.gym_facilities?.name ??
                      "Facility"}
                  </CardDescription>
                </div>
                <StatusBadge status={sessionStatus} showDot />
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    Time
                  </p>
                  <p className="mt-1 font-medium">
                    {dateFormatter.format(startsAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {timeFormatter.format(startsAt)}-
                    {timeFormatter.format(endsAt)}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserRound className="size-4" />
                    Trainer
                  </p>
                  <p className="mt-1 font-medium">
                    {session.users?.full_name ?? "Trainer"}
                  </p>
                  {session.users?.phone ? (
                    <p className="text-sm text-muted-foreground">
                      {session.users.phone}
                    </p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <FeedbackCard feedback={feedback} sessionId={session.id} />
        </div>
      ) : null}
    </PageShell>
  )
}
