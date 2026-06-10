import { Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { TableRowActions } from "@/components/TableRowActions"
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
  starts_at: string
  status: string
  users: { full_name: string | null } | null
}

type FeedbackRow = {
  session_id: string
}

type ClientSummary = {
  memberId: string
  name: string
  totalSessions: number
  upcomingSessions: number
  completedSessions: number
  feedbackCount: number
  lastSessionAt: string | null
  nextSessionAt: string | null
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function summarizeClients(sessions: SessionRow[], feedbacks: FeedbackRow[]) {
  const now = new Date()
  const feedbackSessionIds = new Set(
    feedbacks.map((feedback) => feedback.session_id)
  )
  const clients = new Map<string, ClientSummary>()

  for (const session of sessions) {
    const summary =
      clients.get(session.member_id) ??
      ({
        memberId: session.member_id,
        name: session.users?.full_name ?? "Member",
        totalSessions: 0,
        upcomingSessions: 0,
        completedSessions: 0,
        feedbackCount: 0,
        lastSessionAt: null,
        nextSessionAt: null,
      } satisfies ClientSummary)
    const startsAt = new Date(session.starts_at)

    summary.totalSessions += 1

    if (session.status === "completed") {
      summary.completedSessions += 1
    }

    if (startsAt >= now && session.status === "scheduled") {
      summary.upcomingSessions += 1

      if (
        !summary.nextSessionAt ||
        startsAt < new Date(summary.nextSessionAt)
      ) {
        summary.nextSessionAt = session.starts_at
      }
    }

    if (startsAt < now) {
      if (
        !summary.lastSessionAt ||
        startsAt > new Date(summary.lastSessionAt)
      ) {
        summary.lastSessionAt = session.starts_at
      }
    }

    if (feedbackSessionIds.has(session.id)) {
      summary.feedbackCount += 1
    }

    clients.set(session.member_id, summary)
  }

  return Array.from(clients.values()).sort((first, second) =>
    first.name.localeCompare(second.name)
  )
}

export async function PtMembersPage() {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select("id,member_id,starts_at,status,users:member_id(full_name)")
      .order("starts_at", { ascending: false }),
    supabase.from("pt_session_feedbacks").select("session_id"),
  ])

  const sessions = (sessionResult.data ?? []) as unknown as SessionRow[]
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]
  const clients = summarizeClients(sessions, feedbacks)

  return (
    <PageShell
      eyebrow="PT"
      title="My Clients"
      description="Members connected to your generated PT sessions."
    >
      {clients.length ? (
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Client directory</CardTitle>
            <CardDescription>
              Showing {clients.length} assigned clients.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Member</TableHead>
                  <TableHead className="h-12">Total</TableHead>
                  <TableHead className="h-12">Upcoming</TableHead>
                  <TableHead className="h-12">Completed</TableHead>
                  <TableHead className="h-12">Feedback</TableHead>
                  <TableHead className="h-12">Next session</TableHead>
                  <TableHead className="h-12">Last session</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.memberId} className="h-[4.5rem]">
                    <TableCell className="pl-6 font-medium">
                      {client.name}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap tabular-nums">
                      {client.totalSessions}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap tabular-nums">
                      {client.upcomingSessions}
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap tabular-nums">
                      {client.completedSessions}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="secondary">{client.feedbackCount}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {client.nextSessionAt
                        ? date.format(new Date(client.nextSessionAt))
                        : "None"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {client.lastSessionAt
                        ? date.format(new Date(client.lastSessionAt))
                        : "None"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <TableRowActions
                        label={`Open actions for ${client.name}`}
                        actions={[
                          {
                            href: `/members/${client.memberId}/sessions`,
                            label: "Sessions",
                          },
                        ]}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Users />
            </EmptyMedia>
            <EmptyTitle>No clients yet</EmptyTitle>
            <EmptyDescription>
              Clients appear after a member accepts your assignment and pays.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
