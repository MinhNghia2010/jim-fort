import { PageShell } from "@/components/PageShell"
import {
  MemberSubscriptionsTable,
  type MemberSubscriptionStatus,
  type MemberSubscriptionTableRow,
} from "@/components/screens/member/subscriptions/MemberSubscriptionsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"

type SubscriptionRow = {
  id: string
  status: string
  final_price: number | string
  has_pt_snapshot: boolean
  created_at: string
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

const knownStatuses: readonly MemberSubscriptionStatus[] = [
  "pending_pt_setup",
  "pending_payment",
  "active",
  "expired",
  "cancelled",
]

function toSubscriptionStatus(status: string): MemberSubscriptionStatus {
  return knownStatuses.includes(status as MemberSubscriptionStatus)
    ? (status as MemberSubscriptionStatus)
    : "unknown"
}

function toTableRow(subscription: SubscriptionRow): MemberSubscriptionTableRow {
  return {
    id: subscription.id,
    plan: subscription.membership_packages?.name ?? "Membership",
    facility: subscription.gym_facilities?.name ?? "Jim Fort",
    status: toSubscriptionStatus(subscription.status),
    type: subscription.has_pt_snapshot ? "pt" : "access",
    createdAt: subscription.created_at,
    amount: Number(subscription.final_price) || 0,
  }
}

export async function MemberSubscriptionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,final_price,has_pt_snapshot,created_at,membership_packages(name),gym_facilities(name)"
    )
    .order("created_at", { ascending: false })

  const subscriptions = (data ?? []) as unknown as SubscriptionRow[]
  const rows = subscriptions.map(toTableRow)

  return (
    <PageShell
      eyebrow="Member"
      title="Subscriptions"
      description="Track package setup, payment, activation, and expiry."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Subscriptions could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <MemberSubscriptionsTable subscriptions={rows} />
    </PageShell>
  )
}
