import Link from "next/link"

import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
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

type Props = {
  requestId: string
}

type RequestRow = {
  id: string
  status: string
  facility_id: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

type PreferenceRow = {
  sessions_per_week: number
  preferred_pt_id: string | null
  preferred_pt: { full_name: string | null } | null
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  membership_pt_preference_time_slots:
    | { day_of_week: number; start_time: string; end_time: string }[]
    | null
}

type AssignmentRow = {
  id: string
  status: string
  users: { full_name: string | null } | null
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

export async function ManagerRequestDetailPage({ requestId }: Props) {
  const supabase = await createClient()
  const [requestResult, preferenceResult, assignmentResult] = await Promise.all(
    [
      supabase
        .from("membership_subscriptions")
        .select(
          "id,status,facility_id,users:member_id(full_name),membership_packages(name)"
        )
        .eq("id", requestId)
        .single(),
      supabase
        .from("membership_pt_preferences")
        .select(
          "sessions_per_week,preferred_pt_id,preferred_pt:preferred_pt_id(full_name),preferred_pt_gender,experience_level,training_goal,notes,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", requestId)
        .maybeSingle(),
      supabase
        .from("membership_pt_assignments")
        .select("id,status,users:pt_id(full_name)")
        .eq("subscription_id", requestId)
        .order("created_at", { ascending: false }),
    ]
  )

  const request = requestResult.data as unknown as RequestRow | null
  const preference = preferenceResult.data as unknown as PreferenceRow | null
  const preferenceSlots =
    preference?.membership_pt_preference_time_slots?.sort(
      (first, second) =>
        first.day_of_week - second.day_of_week ||
        first.start_time.localeCompare(second.start_time)
    ) ?? []
  const assignments = (assignmentResult.data ??
    []) as unknown as AssignmentRow[]
  const pendingAssignment = assignments.find(
    (assignment) => assignment.status === "pending_member_decision"
  )
  const error =
    requestResult.error ?? preferenceResult.error ?? assignmentResult.error

  return (
    <PageShell
      eyebrow="Manager"
      title="PT Setup Request"
      description="Assign a trainer and weekly schedule for member approval."
      backHref="/request"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Request could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {request ? (
        <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>{request.users?.full_name ?? "Member"}</CardTitle>
                <CardDescription>
                  {request.membership_packages?.name ?? "Membership"}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <StatusBadge
                  status={request.status}
                  className="w-fit"
                  showDot
                />
                {preference ? (
                  <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-2">
                    <p>
                      <span className="text-muted-foreground">
                        Weekly sessions:
                      </span>{" "}
                      {preference.sessions_per_week}
                    </p>
                    <p>
                      <span className="text-muted-foreground">
                        Preferred PT:
                      </span>{" "}
                      {preference.preferred_pt?.full_name ?? "No preference"}
                    </p>
                    <p>
                      <span className="text-muted-foreground">PT gender:</span>{" "}
                      {preference.preferred_pt_gender.replaceAll("_", " ")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Experience:</span>{" "}
                      {preference.experience_level.replaceAll("_", " ")}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Goal:</span>{" "}
                      {preference.training_goal ?? "Not entered"}
                    </p>
                    <p className="sm:col-span-2">
                      <span className="text-muted-foreground">Notes:</span>{" "}
                      {preference.notes ?? "No notes"}
                    </p>
                    <div className="sm:col-span-2">
                      <p className="mb-2 text-muted-foreground">
                        Member availability
                      </p>
                      {preferenceSlots.length ? (
                        <div className="flex flex-wrap gap-2">
                          {preferenceSlots.map((slot) => (
                            <Badge
                              key={`${slot.day_of_week}-${slot.start_time}-${slot.end_time}`}
                              variant="secondary"
                            >
                              {days[slot.day_of_week]}{" "}
                              {slot.start_time.slice(0, 5)}-
                              {slot.end_time.slice(0, 5)}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No availability slots saved.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No PT preferences saved yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment history</CardTitle>
                <CardDescription>
                  Previous and current PT decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                {assignments.length ? (
                  assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <span>{assignment.users?.full_name ?? "Trainer"}</span>
                      <StatusBadge status={assignment.status} showDot />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assignment has been proposed.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Manager response</CardTitle>
              <CardDescription>
                The request detail page is read-only. Create a separate response
                when you are ready to propose a trainer and schedule.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAssignment ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <StatusBadge
                    status="pending_member_decision"
                    className="w-fit"
                    showDot
                  >
                    Waiting for member decision
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground">
                    A pending proposal already exists for{" "}
                    {pendingAssignment.users?.full_name ?? "Trainer"}. The
                    database allows only one pending PT assignment per
                    subscription.
                  </p>
                </div>
              ) : !preference ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <StatusBadge status="pending" className="w-fit" showDot>
                    Waiting for member preferences
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground">
                    The member needs to send their PT preferences before you can
                    propose a trainer and schedule.
                  </p>
                </div>
              ) : request.status !== "pending_pt_setup" ? (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <StatusBadge status="closed" className="w-fit" showDot>
                    Assignment closed
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground">
                    This subscription is no longer waiting for PT setup.
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 rounded-lg border bg-muted/30 p-4">
                  <StatusBadge status="pending" className="w-fit" showDot>
                    Response not created
                  </StatusBadge>
                  <p className="text-sm text-muted-foreground">
                    Open the response form to choose a trainer and proposed
                    schedule. This keeps the member request detail read-only.
                  </p>
                  <Button asChild>
                    <Link href={`/request/${request.id}/response`}>
                      Create response
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </PageShell>
  )
}
