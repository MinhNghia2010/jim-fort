import Link from "next/link"
import { ClipboardList } from "lucide-react"

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
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Request queue</CardTitle>
            <CardDescription>
              Showing {requests.length} pending request records.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[900px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <colgroup>
                <col className="w-[17rem]" />
                <col className="w-[20rem]" />
                <col className="w-[14rem]" />
                <col className="w-[15rem]" />
                <col className="w-[6rem]" />
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Member</TableHead>
                  <TableHead className="h-12">Package</TableHead>
                  <TableHead className="h-12">Status</TableHead>
                  <TableHead className="h-12">Created</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id} className="h-[4.5rem]">
                    <TableCell className="pl-6 font-medium">
                      {request.users?.full_name ?? "Member"}
                    </TableCell>
                    <TableCell>
                      {request.membership_packages?.name ?? "Membership"}
                    </TableCell>
                    <TableCell>
                      <Badge>{request.status.replaceAll("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      {date.format(new Date(request.created_at))}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button asChild size="sm">
                        <Link href={`/request/${request.id}`}>Open</Link>
                      </Button>
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
