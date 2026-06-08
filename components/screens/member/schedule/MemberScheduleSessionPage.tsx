import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type Props = {
  sessionId: string
}

type SessionRow = {
  id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null } | null
}

type FeedbackRow = {
  feedback: string
  rating: number | null
  next_steps: string | null
  status: string
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export async function MemberScheduleSessionPage({ sessionId }: Props) {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select("id,session_number,starts_at,ends_at,status,users:pt_id(full_name)")
      .eq("id", sessionId)
      .single(),
    supabase
      .from("pt_session_feedbacks")
      .select("feedback,rating,next_steps,status")
      .eq("session_id", sessionId)
      .maybeSingle(),
  ])

  const session = sessionResult.data as unknown as SessionRow | null
  const feedback = feedbackResult.data as unknown as FeedbackRow | null
  const error = sessionResult.error ?? feedbackResult.error

  return (
    <PageShell
      eyebrow="Member"
      title={`Session ${session?.session_number ?? ""}`}
      description="Review session time, trainer, and PT feedback."
      backHref="/schedule"
      backLabel="Schedule"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Session could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {session ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {session.users?.full_name ?? "Trainer"}
              </CardTitle>
              <CardDescription>
                {date.format(new Date(session.starts_at))} -{" "}
                {date.format(new Date(session.ends_at))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Badge>{session.status}</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>PT feedback</CardTitle>
              <CardDescription>
                Feedback appears here after your PT sends it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {feedback ? (
                <>
                  <Badge className="w-fit">{feedback.status}</Badge>
                  <p className="text-sm">{feedback.feedback}</p>
                  {feedback.rating ? (
                    <p className="text-sm text-muted-foreground">
                      Rating: {feedback.rating}/5
                    </p>
                  ) : null}
                  {feedback.next_steps ? (
                    <p className="text-sm text-muted-foreground">
                      Next steps: {feedback.next_steps}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No PT feedback yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
