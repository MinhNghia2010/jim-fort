import Link from "next/link"
import {
  CalendarDays,
  CreditCard,
  MessageCircle,
  PackageCheck,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { isUpcomingScheduleSession } from "@/lib/features/shared/schedule/utils"
import { createClient } from "@/lib/supabase/server"

type SubscriptionRow = {
  id: string
  status: string
  final_price: number | string
  membership_packages: { name: string | null } | null
}

type SessionRow = {
  id: string
  starts_at: string
  status: string
  users: { full_name: string | null } | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value) || 0)
}

export async function MemberOverviewPage() {
  const supabase = await createClient()
  const [subscriptionsResult, sessionsResult, paymentsResult, feedbackResult] =
    await Promise.all([
      supabase
        .from("membership_subscriptions")
        .select("id,status,final_price,membership_packages(name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("membership_pt_sessions")
        .select("id,starts_at,status,users:pt_id(full_name)")
        .in("status", ["scheduled", "missed"])
        .gte("starts_at", new Date().toISOString())
        .order("starts_at", { ascending: true })
        .limit(3),
      supabase
        .from("membership_payments")
        .select("amount")
        .eq("status", "paid"),
      supabase.from("facility_feedbacks").select("id").limit(100),
    ])

  const subscriptions = (subscriptionsResult.data ??
    []) as unknown as SubscriptionRow[]
  const sessions = (sessionsResult.data ?? []) as unknown as SessionRow[]
  const upcomingSessions = sessions.filter((session) =>
    isUpcomingScheduleSession(session)
  )
  const paidTotal = (paymentsResult.data ?? []).reduce(
    (sum, payment) => sum + Number(payment.amount ?? 0),
    0
  )
  const activeSubscription = subscriptions.find(
    (subscription) => subscription.status === "active"
  )
  const pendingSubscription = subscriptions.find((subscription) =>
    ["pending_pt_setup", "pending_payment"].includes(subscription.status)
  )
  const error =
    subscriptionsResult.error ??
    sessionsResult.error ??
    paymentsResult.error ??
    feedbackResult.error

  return (
    <PageShell
      eyebrow="Member"
      title="Overview"
      description="Your membership status, next sessions, payments, and feedback."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Overview data could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Active memberships"
          value={
            subscriptions.filter(
              (subscription) => subscription.status === "active"
            ).length
          }
          description={
            activeSubscription?.membership_packages?.name ?? "No active plan"
          }
          icon={PackageCheck}
        />
        <SummaryCard
          title="Pending setup"
          value={
            subscriptions.filter((subscription) =>
              ["pending_pt_setup", "pending_payment"].includes(
                subscription.status
              )
            ).length
          }
          description={
            pendingSubscription
              ? pendingSubscription.status.replaceAll("_", " ")
              : "Nothing pending"
          }
          icon={CreditCard}
        />
        <SummaryCard
          title="Paid total"
          value={formatCurrency(paidTotal)}
          description="Completed member payments"
          icon={CreditCard}
        />
        <SummaryCard
          title="Feedback sent"
          value={feedbackResult.data?.length ?? 0}
          description="Facility feedback records"
          icon={MessageCircle}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Next PT sessions</CardTitle>
            <CardDescription>
              Upcoming scheduled training sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {upcomingSessions.length ? (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {session.users?.full_name ?? "Trainer"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {dateFormatter.format(new Date(session.starts_at))}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/schedule/sessions/${session.id}`}>Open</Link>
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No upcoming PT sessions.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership workflow</CardTitle>
            <CardDescription>
              Continue wherever your latest subscription needs attention.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {subscriptions.slice(0, 4).map((subscription) => (
              <div
                key={subscription.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {subscription.membership_packages?.name ?? "Membership"}
                  </p>
                  <StatusBadge status={subscription.status} showDot />
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/subscriptions/${subscription.id}`}>Open</Link>
                </Button>
              </div>
            ))}
            {!subscriptions.length ? (
              <Button asChild>
                <Link href="/memberships">
                  <CalendarDays data-icon="inline-start" />
                  Browse plans
                </Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
