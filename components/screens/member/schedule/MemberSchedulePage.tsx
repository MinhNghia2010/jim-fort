import Link from "next/link"
import { CalendarDays } from "lucide-react"

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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

type SessionRow = {
  id: string
  subscription_id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null } | null
  membership_subscriptions: {
    membership_packages: { name: string | null } | null
  } | null
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
})

function statusVariant(status: string) {
  if (status === "scheduled" || status === "completed") {
    return "default" as const
  }

  if (status === "cancelled" || status === "missed") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberSchedulePage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_pt_sessions")
    .select(
      "id,subscription_id,session_number,starts_at,ends_at,status,users:pt_id(full_name),membership_subscriptions(membership_packages(name))"
    )
    .order("starts_at", { ascending: true })

  const sessions = (data ?? []) as unknown as SessionRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Schedule"
      description="Generated PT sessions from your accepted and paid PT subscriptions."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Schedule could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {sessions.length ? (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const startsAt = new Date(session.starts_at)
            const endsAt = new Date(session.ends_at)

            return (
              <Card key={session.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle>
                        Session {session.session_number} ·{" "}
                        {session.users?.full_name ?? "Trainer"}
                      </CardTitle>
                      <CardDescription>
                        {session.membership_subscriptions?.membership_packages
                          ?.name ?? "PT package"}
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant(session.status)}>
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">
                      {dateFormatter.format(startsAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {timeFormatter.format(startsAt)}-
                      {timeFormatter.format(endsAt)}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/schedule/sessions/${session.id}`}>
                      Open session
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDays />
                </EmptyMedia>
                <EmptyTitle>No PT sessions yet</EmptyTitle>
                <EmptyDescription>
                  Sessions are generated after a PT assignment is accepted and
                  the subscription is paid.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
