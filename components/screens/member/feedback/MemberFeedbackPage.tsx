import { MessageCircle } from "lucide-react"

import { createFacilityFeedback } from "@/app/(main)/member-actions"
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
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
  rating: number | null
  status: string
  manager_response: string | null
  created_at: string
  gym_facilities: { name: string | null } | null
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function statusVariant(status: string) {
  if (status === "responded") {
    return "default" as const
  }

  if (status === "closed") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberFeedbackPage() {
  const supabase = await createClient()
  const [facilityResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select("facility_id,gym_facilities(name)")
      .order("created_at", { ascending: false }),
    supabase
      .from("facility_feedbacks")
      .select(
        "id,subject,message,rating,status,manager_response,created_at,gym_facilities(name)"
      )
      .order("created_at", { ascending: false }),
  ])

  const facilities = Array.from(
    new Map(
      ((facilityResult.data ?? []) as unknown as FacilityRow[]).map((row) => [
        row.facility_id,
        row,
      ])
    ).values()
  )
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Feedback"
      description="Send facility feedback and review manager responses."
    >
      {facilityResult.error || feedbackResult.error ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback data could not be loaded</AlertTitle>
          <AlertDescription>
            {facilityResult.error?.message ?? feedbackResult.error?.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>New feedback</CardTitle>
          <CardDescription>
            You can send feedback for facilities where you have subscription
            history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberActionForm
            action={createFacilityFeedback}
            submitLabel="Submit feedback"
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="facilityId">Facility</Label>
                <select
                  id="facilityId"
                  name="facilityId"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                  required
                >
                  <option value="">Select facility</option>
                  {facilities.map((facility) => (
                    <option
                      key={facility.facility_id}
                      value={facility.facility_id}
                    >
                      {facility.gym_facilities?.name ?? "Facility"}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="rating">Rating</Label>
                <select
                  id="rating"
                  name="rating"
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">No rating</option>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" name="subject" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" rows={4} required />
            </div>
          </MemberActionForm>
        </CardContent>
      </Card>

      {feedbacks.length ? (
        <div className="grid gap-4">
          {feedbacks.map((feedback) => (
            <Card key={feedback.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>{feedback.subject}</CardTitle>
                    <CardDescription>
                      {feedback.gym_facilities?.name ?? "Facility"} ·{" "}
                      {dateFormatter.format(new Date(feedback.created_at))}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(feedback.status)}>
                    {feedback.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm">{feedback.message}</p>
                {feedback.rating ? (
                  <p className="text-sm text-muted-foreground">
                    Rating: {feedback.rating}/5
                  </p>
                ) : null}
                {feedback.manager_response ? (
                  <div className="rounded-lg bg-muted p-3 text-sm">
                    <p className="font-medium">Manager response</p>
                    <p className="text-muted-foreground">
                      {feedback.manager_response}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <MessageCircle />
                </EmptyMedia>
                <EmptyTitle>No feedback yet</EmptyTitle>
                <EmptyDescription>
                  Submitted facility feedback will appear here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
