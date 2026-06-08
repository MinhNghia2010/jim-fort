import Link from "next/link"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
  Users,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type SessionRow = {
  id: string
  member_id: string
  session_number: number
  starts_at: string
  status: string
  users: { full_name: string | null } | null
}

type FeedbackRow = {
  session_id: string
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function isToday(value: string) {
  const target = new Date(value)
  const now = new Date()

  return (
    target.getFullYear() === now.getFullYear() &&
    target.getMonth() === now.getMonth() &&
    target.getDate() === now.getDate()
  )
}

export async function PtOverviewPage() {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,member_id,session_number,starts_at,status,users:member_id(full_name)"
      )
      .order("starts_at", { ascending: true }),
    supabase.from("pt_session_feedbacks").select("session_id"),
  ])

  const sessions = (sessionResult.data ?? []) as unknown as SessionRow[]
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]
  const feedbackSessionIds = new Set(
    feedbacks.map((feedback) => feedback.session_id)
  )
  const now = new Date()
  const clients = new Set(sessions.map((session) => session.member_id))
  const todaySessions = sessions.filter((session) => isToday(session.starts_at))
  const upcomingSessions = sessions.filter(
    (session) =>
      session.status === "scheduled" && new Date(session.starts_at) >= now
  )
  const needsFeedback = sessions.filter(
    (session) =>
      new Date(session.starts_at) < now && !feedbackSessionIds.has(session.id)
  )
  const error = sessionResult.error ?? feedbackResult.error

  return (
    <PageShell
      eyebrow="PT"
      title="Overview"
      description="Your active clients, upcoming sessions, and feedback work."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>PT overview could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Active clients"
          value={clients.size}
          detail="Members with generated PT sessions"
          icon={Users}
        />
        <ManagementMetricCard
          title="Today"
          value={todaySessions.length}
          detail="Sessions scheduled today"
          icon={CalendarDays}
        />
        <ManagementMetricCard
          title="Upcoming"
          value={upcomingSessions.length}
          detail="Scheduled future sessions"
          icon={Clock}
        />
        <ManagementMetricCard
          title="Needs feedback"
          value={needsFeedback.length}
          detail="Past sessions without PT notes"
          icon={MessageSquareWarning}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Next sessions</CardTitle>
            <CardDescription>Open a session to review details.</CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[560px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <colgroup>
                <col className="w-[17rem]" />
                <col className="w-[16rem]" />
                <col className="w-[6rem]" />
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Member</TableHead>
                  <TableHead className="h-12">Time</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingSessions.slice(0, 5).map((session) => (
                  <TableRow key={session.id} className="h-[4.5rem]">
                    <TableCell className="pl-6 font-medium">
                      {session.users?.full_name ?? "Member"}
                    </TableCell>
                    <TableCell>
                      {date.format(new Date(session.starts_at))}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm">
                        <Link href={`/schedule/sessions/${session.id}`}>
                          Open
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!upcomingSessions.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No upcoming sessions.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Feedback queue</CardTitle>
            <CardDescription>
              Past sessions that still need member feedback.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[520px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <colgroup>
                <col className="w-[17rem]" />
                <col className="w-[9rem]" />
                <col className="w-[8rem]" />
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Member</TableHead>
                  <TableHead className="h-12">Session</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {needsFeedback.slice(0, 5).map((session) => (
                  <TableRow key={session.id} className="h-[4.5rem]">
                    <TableCell className="pl-6 font-medium">
                      {session.users?.full_name ?? "Member"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">#{session.session_number}</Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/schedule/sessions/${session.id}`}>
                          Feedback
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!needsFeedback.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No feedback waiting.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>PT workflow</CardTitle>
          <CardDescription>
            Your role starts after member acceptance and payment generate
            sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <CheckCircle2 data-icon="inline-start" />
            View assigned sessions
          </Badge>
          <Badge variant="secondary">Track clients</Badge>
          <Badge variant="secondary">Send feedback</Badge>
        </CardContent>
      </Card>
    </PageShell>
  )
}
