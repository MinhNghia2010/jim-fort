import Link from "next/link"
import { CalendarDays } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type SessionRow = {
  id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null } | null
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export async function MemberSchedulePage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_pt_sessions")
    .select("id,session_number,starts_at,ends_at,status,users:pt_id(full_name)")
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
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trainer</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Start</TableHead>
                <TableHead>Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {session.users?.full_name ?? "Trainer"}
                  </TableCell>
                  <TableCell>#{session.session_number}</TableCell>
                  <TableCell>{date.format(new Date(session.starts_at))}</TableCell>
                  <TableCell>
                    <Badge>{session.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/schedule/sessions/${session.id}`}>Open</Link>
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
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No PT sessions yet</EmptyTitle>
            <EmptyDescription>
              Sessions are generated after a PT assignment is accepted and the
              subscription is paid.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
