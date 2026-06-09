import { notFound } from "next/navigation"
import { CheckCheck, MessageSquareText } from "lucide-react"

import { markSessionFeedbackRead } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type FeedbackRow = {
  id: string
  feedback: string
  rating: number | null
  next_steps: string | null
  status: string
  sent_at: string
  member_read_at: string | null
  users: { full_name: string | null } | null
  membership_pt_sessions: {
    session_number: number
    starts_at: string
  } | null
}

interface MemberSessionFeedbackPageProps {
  sessionId: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function statusVariant(status: string) {
  if (status === "read") {
    return "default" as const
  }

  if (status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberSessionFeedbackPage({
  sessionId,
}: MemberSessionFeedbackPageProps) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("pt_session_feedbacks")
    .select(
      "id,feedback,rating,next_steps,status,sent_at,member_read_at,users:pt_id(full_name),membership_pt_sessions(session_number,starts_at)"
    )
    .eq("session_id", sessionId)
    .maybeSingle()

  if (!data && !error) {
    notFound()
  }

  const feedback = data as unknown as FeedbackRow | null

  return (
    <PageShell
      backHref={`/schedule/sessions/${sessionId}`}
      eyebrow="Session feedback"
      title={
        feedback?.membership_pt_sessions
          ? `Session ${feedback.membership_pt_sessions.session_number}`
          : "PT feedback"
      }
      description="Read your trainer feedback and next steps."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {feedback ? (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquareText className="size-5" />
                  {feedback.users?.full_name ?? "Trainer"} feedback
                </CardTitle>
                <CardDescription>
                  Sent {dateFormatter.format(new Date(feedback.sent_at))}
                </CardDescription>
              </div>
              <Badge variant={statusVariant(feedback.status)}>
                {feedback.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
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
                  ? dateFormatter.format(new Date(feedback.member_read_at))
                  : ""}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </PageShell>
  )
}
