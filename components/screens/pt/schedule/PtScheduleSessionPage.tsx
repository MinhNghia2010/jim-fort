import { sendPtSessionFeedback } from "@/app/(main)/pt-actions"
import { PageShell } from "@/components/PageShell"
import { PtActionForm } from "@/components/screens/pt/PtActionForm"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getScheduleSessionStatus } from "@/lib/features/shared/schedule/utils"
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

export async function PtScheduleSessionPage({ sessionId }: Props) {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,session_number,starts_at,ends_at,status,users:member_id(full_name)"
      )
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
  const sessionStatus = session ? getScheduleSessionStatus(session) : null

  return (
    <PageShell
      eyebrow="PT"
      title={`Session ${session?.session_number ?? ""}`}
      description="Review session details and send member feedback."
      backHref="/schedule"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Session could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {session ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{session.users?.full_name ?? "Member"}</CardTitle>
                <CardDescription>
                  {date.format(new Date(session.starts_at))} -{" "}
                  {date.format(new Date(session.ends_at))}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Session</p>
                  <p className="font-medium">#{session.session_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <StatusBadge status={sessionStatus} showDot />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Feedback</p>
                  <StatusBadge
                    status={feedback ? feedback.status : "not sent"}
                    showDot
                  >
                    {feedback ? feedback.status : "not sent"}
                  </StatusBadge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>PT actions</CardTitle>
                <CardDescription>
                  These are the available actions for this role.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm text-muted-foreground">
                <p>View assigned member and generated session time.</p>
                <p>Send or update session feedback for the member.</p>
                <p>
                  Session time and assignment are controlled by the manager
                  proposal and member payment flow.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Session feedback</CardTitle>
              <CardDescription>
                This feedback is visible to the member.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PtActionForm
                action={sendPtSessionFeedback}
                submitLabel={feedback ? "Update feedback" : "Send feedback"}
              >
                <input type="hidden" name="sessionId" value={session.id} />
                <div className="grid gap-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="1"
                    max="5"
                    defaultValue={feedback?.rating ?? ""}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="feedback">Feedback</Label>
                  <Textarea
                    id="feedback"
                    name="feedback"
                    defaultValue={feedback?.feedback ?? ""}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nextSteps">Next steps</Label>
                  <Textarea
                    id="nextSteps"
                    name="nextSteps"
                    defaultValue={feedback?.next_steps ?? ""}
                  />
                </div>
              </PtActionForm>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
