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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type Props = {
  memberId: string
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
  session_id: string
  status: string
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export async function PtMemberSessionsPage({ memberId }: Props) {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,session_number,starts_at,ends_at,status,users:member_id(full_name)"
      )
      .eq("member_id", memberId)
      .order("starts_at", { ascending: true }),
    supabase.from("pt_session_feedbacks").select("session_id,status"),
  ])

  const sessions = (sessionResult.data ?? []) as unknown as SessionRow[]
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]
  const feedbackBySession = new Map(
    feedbacks.map((feedback) => [feedback.session_id, feedback])
  )
  const memberName = sessions[0]?.users?.full_name ?? "Member"
  const now = new Date()
  const upcomingCount = sessions.filter(
    (session) =>
      session.status === "scheduled" && new Date(session.starts_at) >= now
  ).length
  const completedCount = sessions.filter(
    (session) => session.status === "completed"
  ).length
  const feedbackCount = sessions.filter((session) =>
    feedbackBySession.has(session.id)
  ).length
  const error = sessionResult.error ?? feedbackResult.error

  return (
    <PageShell
      eyebrow="PT"
      title={`${memberName} Sessions`}
      description="All sessions generated for this client."
      backHref="/members"
      backLabel="My Clients"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Client sessions could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {sessions.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total sessions</CardTitle>
                <CardDescription>Generated for this client</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{sessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Upcoming</CardTitle>
                <CardDescription>Scheduled future sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{upcomingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Completed</CardTitle>
                <CardDescription>Finished session records</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{completedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Feedback sent</CardTitle>
                <CardDescription>Sessions with PT feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{feedbackCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-4">
              <CardTitle>Session directory</CardTitle>
              <CardDescription>
                Showing {sessions.length} sessions for {memberName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table className="min-w-[980px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
                <colgroup>
                  <col className="w-[9rem]" />
                  <col className="w-[17rem]" />
                  <col className="w-[17rem]" />
                  <col className="w-[11rem]" />
                  <col className="w-[12rem]" />
                  <col className="w-[6rem]" />
                </colgroup>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="h-12 pl-6">Session</TableHead>
                    <TableHead className="h-12">Start</TableHead>
                    <TableHead className="h-12">End</TableHead>
                    <TableHead className="h-12">Status</TableHead>
                    <TableHead className="h-12">Feedback</TableHead>
                    <TableHead className="h-12 pr-6 text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => {
                    const feedback = feedbackBySession.get(session.id)

                    return (
                      <TableRow key={session.id} className="h-[4.5rem]">
                        <TableCell className="pl-6 font-medium">
                          #{session.session_number}
                        </TableCell>
                        <TableCell>
                          {date.format(new Date(session.starts_at))}
                        </TableCell>
                        <TableCell>
                          {date.format(new Date(session.ends_at))}
                        </TableCell>
                        <TableCell>
                          <Badge>{session.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={feedback ? "secondary" : "outline"}>
                            {feedback?.status ?? "not sent"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-6 text-right">
                          <Button asChild size="sm">
                            <Link href={`/schedule/sessions/${session.id}`}>
                              Open
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No sessions for this client</EmptyTitle>
            <EmptyDescription>
              Sessions appear here after the member accepts and pays.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
