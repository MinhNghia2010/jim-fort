import { MessageCircle } from "lucide-react"

import { createFacilityFeedback } from "@/app/(main)/member-actions"
import { FormSelect } from "@/components/FormSelect"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { createClient } from "@/lib/supabase/server"

type FacilityRow = {
  facility_id: string
  gym_facilities: { name: string | null } | null
}

type FeedbackRow = {
  id: string
  subject: string
  message: string
  status: string
  rating: number | null
  created_at: string
  manager_response: string | null
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

export async function MemberFeedbackPage() {
  const supabase = await createClient()
  const [facilitiesResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select("facility_id,gym_facilities(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_feedbacks")
      .select("id,subject,message,status,rating,created_at,manager_response")
      .order("created_at", { ascending: false }),
  ])

  const facilities = Array.from(
    new Map(
      ((facilitiesResult.data ?? []) as unknown as FacilityRow[]).map((row) => [
        row.facility_id,
        row,
      ])
    ).values()
  )
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]
  const error = facilitiesResult.error ?? feedbackResult.error

  return (
    <PageShell
      eyebrow="Member"
      title="Feedback"
      description="Send facility feedback and view manager responses."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>New feedback</CardTitle>
            <CardDescription>
              Feedback can be sent to facilities you have subscribed to.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberActionForm
              action={createFacilityFeedback}
              submitLabel="Send feedback"
            >
              <div className="grid gap-2">
                <Label htmlFor="facilityId">Facility</Label>
                <FormSelect
                  id="facilityId"
                  name="facilityId"
                  options={facilities.map((facility) => ({
                    value: facility.facility_id,
                    label: facility.gym_facilities?.name ?? "Jim Fort",
                  }))}
                  defaultValue={facilities[0]?.facility_id}
                  placeholder="Select a facility"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" name="subject" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating</Label>
                <Input
                  id="rating"
                  name="rating"
                  type="number"
                  min="1"
                  max="5"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea id="message" name="message" required />
              </div>
            </MemberActionForm>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {feedbacks.length ? (
            feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <CardTitle>{feedback.subject}</CardTitle>
                  <CardDescription>
                    {date.format(new Date(feedback.created_at))}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge status={feedback.status} showDot />
                    {feedback.rating ? (
                      <Badge variant="secondary">{feedback.rating}/5</Badge>
                    ) : null}
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Your message
                    </p>
                    <p className="text-sm leading-6 whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>
                  <div className="grid gap-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Manager response
                    </p>
                    <p className="text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                      {feedback.manager_response ?? "No manager response yet."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="flex min-h-72 flex-col items-center justify-center gap-2 text-center">
                <MessageCircle className="size-8 text-muted-foreground" />
                <p className="font-medium">No feedback yet</p>
                <p className="text-sm text-muted-foreground">
                  Your submitted feedback will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageShell>
  )
}
