import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarClock, MessageSquareText, UserRound } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  rating: number | null
  status: string
  sent_at: string
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

function statusVariant(status: string) {
  if (status === "scheduled" || status === "completed" || status === "read") {
    return "default" as const
  }

  if (status === "cancelled" || status === "missed" || status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
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
      .select("id,rating,status,sent_at")
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

  return (
    <PageShell
      backHref="/schedule"
      backLabel="Back to schedule"
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
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
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
                <Badge variant={statusVariant(session.status)}>
                  {session.status}
                </Badge>
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
            <CardContent className="grid gap-3">
              {feedback ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant={statusVariant(feedback.status)}>
                      {feedback.status}
                    </Badge>
                    {feedback.rating ? (
                      <span className="text-sm text-muted-foreground">
                        {feedback.rating}/5
                      </span>
                    ) : null}
                  </div>
                  <Button asChild>
                    <Link href={`/schedule/sessions/${session.id}/feedback`}>
                      Open feedback
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No PT feedback has been sent for this session yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
