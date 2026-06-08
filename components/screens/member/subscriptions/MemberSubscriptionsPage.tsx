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
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

export async function MemberSubscriptionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,final_price,has_pt_snapshot,created_at,membership_packages(name),gym_facilities(name)"
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
                <CardTitle>
                  {subscription.membership_packages?.name ?? "Membership"}
                </CardTitle>
                <CardDescription>
                  {subscription.gym_facilities?.name ?? "Jim Fort"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>{subscription.status.replaceAll("_", " ")}</Badge>
                  <Badge variant="secondary">
                    {subscription.has_pt_snapshot ? "PT package" : "Access package"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {currency.format(Number(subscription.final_price) || 0)}
                  </span>
                </div>
                <Button asChild>
                  <Link href={`/subscriptions/${subscription.id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
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
      )}
    </PageShell>
  )
}
