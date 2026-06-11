import { ClipboardList } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import {
  PtRequestsTable,
  type PtAssignmentTableRow,
} from "@/components/screens/pt/requests/PtRequestsTable"
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
import { getAuthenticatedUser } from "@/lib/auth/current-user"
import { createClient } from "@/lib/supabase/server"

export async function PtRequestsPage() {
  const user = await getAuthenticatedUser()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_pt_assignments")
    .select(
      `
            id,
            subscription_id,
            status,
            schedule_starts_on,
            schedule_note,
            assigned_at,
            membership_subscriptions(
              id,
              status,
              users:member_id(full_name, phone),
              membership_packages(name)
            )
          `
    )
    .eq("pt_id", user.id)
    .order("assigned_at", { ascending: false })
  const assignments = (data ?? []) as unknown as PtAssignmentTableRow[]

  return (
    <PageShell
      eyebrow="PT"
      title="Requests"
      description="Review member PT assignment requests connected to your account."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Requests could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {assignments.length ? (
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Assignment requests</CardTitle>
            <CardDescription>
              Showing {assignments.length} PT assignment records.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <PtRequestsTable assignments={assignments} />
          </CardContent>
        </Card>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ClipboardList />
            </EmptyMedia>
            <EmptyTitle>No PT requests</EmptyTitle>
            <EmptyDescription>
              Assignment requests appear here after a manager proposes you for a
              member package.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
