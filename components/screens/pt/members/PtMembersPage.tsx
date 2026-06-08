import Link from "next/link"
import { Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  const feedbackSessionIds = new Set(feedbacks.map((feedback) => feedback.session_id))
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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Upcoming</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Next session</TableHead>
                <TableHead>Last session</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.memberId}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.totalSessions}</TableCell>
                  <TableCell>{client.upcomingSessions}</TableCell>
                  <TableCell>{client.completedSessions}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{client.feedbackCount}</Badge>
                  </TableCell>
                  <TableCell>
                    {client.nextSessionAt
                      ? date.format(new Date(client.nextSessionAt))
                      : "None"}
                  </TableCell>
                  <TableCell>
                    {client.lastSessionAt
                      ? date.format(new Date(client.lastSessionAt))
                      : "None"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/members/${client.memberId}/sessions`}>
                        Sessions
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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
