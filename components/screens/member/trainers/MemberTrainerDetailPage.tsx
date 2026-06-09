import Link from "next/link"
import { notFound } from "next/navigation"
import { CalendarDays, Dumbbell, Phone, UserRound } from "lucide-react"

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

type TrainerRow = {
  facility_id: string
  pt_id: string
  gym_facilities: { name: string | null } | null
  users: {
    full_name: string | null
    phone: string | null
    avatar_url: string | null
  } | null
}

type SessionRow = {
  id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
}

type AssignmentRow = {
  id: string
  status: string
  schedule_starts_on: string | null
  schedule_note: string | null
}

interface MemberTrainerDetailPageProps {
  trainerId: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
})

function statusVariant(status: string) {
  if (status === "accepted" || status === "scheduled" || status === "completed") {
    return "default" as const
  }

  if (status === "rejected" || status === "cancelled" || status === "missed") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberTrainerDetailPage({
  trainerId,
}: MemberTrainerDetailPageProps) {
  const supabase = await createClient()
  const [trainerResult, sessionsResult, assignmentsResult] = await Promise.all([
    supabase
      .from("facility_pts")
      .select(
        "facility_id,pt_id,gym_facilities(name),users:pt_id(full_name,phone,avatar_url)"
      )
      .eq("pt_id", trainerId)
      .maybeSingle(),
    supabase
      .from("membership_pt_sessions")
      .select("id,session_number,starts_at,ends_at,status")
      .eq("pt_id", trainerId)
      .order("starts_at", { ascending: true })
      .limit(8),
    supabase
      .from("membership_pt_assignments")
      .select("id,status,schedule_starts_on,schedule_note")
      .eq("pt_id", trainerId)
      .order("assigned_at", { ascending: false })
      .limit(5),
  ])

  if (!trainerResult.data && !trainerResult.error) {
    notFound()
  }

  const trainer = trainerResult.data as unknown as TrainerRow | null
  const sessions = (sessionsResult.data ?? []) as SessionRow[]
  const assignments = (assignmentsResult.data ?? []) as AssignmentRow[]
  const error =
    trainerResult.error ?? sessionsResult.error ?? assignmentsResult.error

  return (
    <PageShell
      backHref="/trainers"
      eyebrow={trainer?.gym_facilities?.name ?? "Member trainer"}
      title={trainer?.users?.full_name ?? "Trainer"}
      description="Trainer profile, assignment status, and your upcoming PT sessions."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Trainer could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {trainer ? (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <UserRound className="size-7" />
                </div>
                <div className="min-w-0">
                  <CardTitle>{trainer.users?.full_name ?? "Trainer"}</CardTitle>
                  <CardDescription>
                    {trainer.gym_facilities?.name ?? "Facility trainer"}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  <Dumbbell className="size-3" />
                  Personal trainer
                </Badge>
                {trainer.users?.phone ? (
                  <Badge variant="outline">
                    <Phone className="size-3" />
                    {trainer.users.phone}
                  </Badge>
                ) : null}
              </div>
              <Button asChild>
                <Link href="/memberships">Choose PT package</Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>
                  Your PT assignment history with this trainer.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {assignments.length ? (
                  assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <Badge variant={statusVariant(assignment.status)}>
                          {assignment.status.replaceAll("_", " ")}
                        </Badge>
                        <span className="text-muted-foreground">
                          {assignment.schedule_starts_on
                            ? dateFormatter.format(
                                new Date(assignment.schedule_starts_on)
                              )
                            : "No start date"}
                        </span>
                      </div>
                      {assignment.schedule_note ? (
                        <p className="mt-2 text-muted-foreground">
                          {assignment.schedule_note}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No assignment history with this trainer yet.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="size-5" />
                  Sessions
                </CardTitle>
                <CardDescription>
                  Your generated sessions with this trainer.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                {sessions.length ? (
                  sessions.map((session) => {
                    const startsAt = new Date(session.starts_at)
                    const endsAt = new Date(session.ends_at)

                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            Session {session.session_number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {dateFormatter.format(startsAt)} -{" "}
                            {timeFormatter.format(startsAt)}-
                            {timeFormatter.format(endsAt)}
                          </p>
                        </div>
                        <Badge variant={statusVariant(session.status)}>
                          {session.status}
                        </Badge>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No generated sessions with this trainer yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}
    </PageShell>
  )
}
