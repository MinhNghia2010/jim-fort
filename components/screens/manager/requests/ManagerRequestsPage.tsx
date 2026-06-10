import { ClipboardList } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import {
  ManagerRequestsTable,
  type ManagerRequestTableRow,
} from "@/components/screens/manager/requests/ManagerRequestsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

export async function ManagerRequestsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,has_pt_snapshot,created_at,users:member_id(full_name),membership_packages(name)"
    )
    .in("status", ["pending_pt_setup", "pending_payment"])
    .order("created_at", { ascending: false })

  const requests = (data ?? []) as unknown as ManagerRequestTableRow[]

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
            <ManagerRequestsTable requests={requests} />
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
