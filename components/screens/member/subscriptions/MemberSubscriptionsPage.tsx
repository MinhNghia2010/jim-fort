import Link from "next/link"
import { ClipboardList, CreditCard, Dumbbell } from "lucide-react"

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
import { createClient } from "@/lib/supabase/server"

type SubscriptionRow = {
  id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  duration_days_snapshot: number | null
  session_count_snapshot: number | null
  created_at: string
  starts_at: string | null
  expires_at: string | null
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value) || 0)
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set"
  }

  return dateFormatter.format(new Date(value))
}

function statusVariant(status: string) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "cancelled" || status === "expired") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberSubscriptionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,base_price,discount_amount,final_price,has_pt_snapshot,duration_days_snapshot,session_count_snapshot,created_at,starts_at,expires_at,membership_packages(name),gym_facilities(name)"
    )
    .order("created_at", { ascending: false })

  const subscriptions = (data ?? []) as unknown as SubscriptionRow[]

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

      {subscriptions.length ? (
        <div className="grid gap-4">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2">
                      {subscription.has_pt_snapshot ? (
                        <Dumbbell className="size-5" />
                      ) : (
                        <CreditCard className="size-5" />
                      )}
                      {subscription.membership_packages?.name ?? "Membership"}
                    </CardTitle>
                    <CardDescription>
                      {subscription.gym_facilities?.name ?? "Facility"} ·{" "}
                      {subscription.has_pt_snapshot
                        ? `${subscription.session_count_snapshot ?? 0} PT sessions`
                        : `${subscription.duration_days_snapshot ?? 0} days`}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={statusVariant(subscription.status)}
                    className="w-fit capitalize"
                  >
                    {subscription.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[1fr_auto]">
                <div className="grid gap-3 text-sm sm:grid-cols-3">
                  <div>
                    <p className="text-muted-foreground">Final price</p>
                    <p className="font-mono font-medium">
                      {formatCurrency(subscription.final_price)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Starts</p>
                    <p>{formatDate(subscription.starts_at)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p>{formatDate(subscription.expires_at)}</p>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/subscriptions/${subscription.id}`}>
                    Open subscription
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ClipboardList />
                </EmptyMedia>
                <EmptyTitle>No subscriptions yet</EmptyTitle>
                <EmptyDescription>
                  Start from Membership Plans to create your first subscription.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
