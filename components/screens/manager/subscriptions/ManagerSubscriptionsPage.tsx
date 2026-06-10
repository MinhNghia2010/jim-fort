import { PageShell } from "@/components/PageShell"
import {
  ManagerSubscriptionsTable,
  type ManagerSubscriptionTableRow,
} from "@/components/screens/manager/subscriptions/ManagerSubscriptionsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"

function sortManagerSubscriptionRows(rows: ManagerSubscriptionTableRow[]) {
  return [...rows].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  )
}

export async function ManagerSubscriptionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,final_price,created_at,users:member_id(full_name),membership_packages(name)"
    )
    .order("created_at", { ascending: false })

  const rows = sortManagerSubscriptionRows(
    (data ?? []) as unknown as ManagerSubscriptionTableRow[]
  )

  return (
    <PageShell
      eyebrow="Manager"
      title="Subscriptions"
      description="Monitor member subscriptions across setup, payment, and activation."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscriptions could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <ManagerSubscriptionsTable rows={rows} />
    </PageShell>
  )
}
