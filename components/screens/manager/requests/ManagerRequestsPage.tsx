import Link from "next/link"
import { ClipboardList } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type RequestRow = {
  id: string
  status: string
  has_pt_snapshot: boolean
  created_at: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export async function ManagerRequestsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,has_pt_snapshot,created_at,users:member_id(full_name),membership_packages(name)"
    )
    .in("status", ["pending_pt_setup", "pending_payment"])
    .order("created_at", { ascending: false })

  const requests = (data ?? []) as unknown as RequestRow[]

  return (
    <PageShell
      eyebrow="Manager"
      title="Requests"
      description="Review PT setup requests and subscriptions waiting for payment."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Requests could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {requests.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Package</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">
                    {request.users?.full_name ?? "Member"}
                  </TableCell>
                  <TableCell>{request.membership_packages?.name ?? "Membership"}</TableCell>
                  <TableCell>
                    <Badge>{request.status.replaceAll("_", " ")}</Badge>
                  </TableCell>
                  <TableCell>{date.format(new Date(request.created_at))}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm">
                      <Link href={`/request/${request.id}`}>Open</Link>
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
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No pending requests</EmptyTitle>
            <EmptyDescription>
              PT setup and pending payment requests will appear here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
