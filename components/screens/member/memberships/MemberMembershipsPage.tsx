import Link from "next/link"
import { Check, Dumbbell, PackageCheck } from "lucide-react"

import { createMemberSubscription } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
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
import { cn } from "@/lib/utils"

type PackageRow = {
  id: string
  name: string
  description: string | null
  price: number | string
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  gym_facilities: { name: string | null } | null
}

type ActiveSubscriptionRow = {
  id: string
  package_id: string
  status: string
  expires_at: string | null
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function formatMoney(value: number | string) {
  return currency.format(Number(value) || 0)
}

function formatTerm(plan: PackageRow) {
  if (plan.has_pt) {
    return `${plan.session_count ?? 0} sessions`
  }

  const days = plan.duration_days ?? 0

  if (days % 365 === 0) {
    const years = days / 365
    return `${years} ${years === 1 ? "year" : "years"}`
  }

  if (days % 30 === 0) {
    const months = days / 30
    return `${months} ${months === 1 ? "month" : "months"}`
  }

  return `${days} days`
}

function buildFeatures(plan: PackageRow) {
  const facilityName = plan.gym_facilities?.name ?? "Jim Fort"

  return [
    plan.has_pt
      ? `${plan.session_count ?? 0} personal training sessions`
      : `${plan.duration_days ?? 0} days of facility access`,
    `Facility: ${facilityName}`,
    plan.has_pt
      ? "Personal trainer assignment included"
      : "Access package without personal training setup",
  ]
}

function MemberPlanCard({
  plan,
  activeSubscription,
}: {
  plan: PackageRow
  activeSubscription: ActiveSubscriptionRow | null
}) {
  const isActive = Boolean(activeSubscription)
  const description =
    plan.description ??
    (plan.has_pt
      ? "Includes PT assignment, schedule approval, and session tracking."
      : "Facility access plan without personal training setup.")

  return (
    <Card
      className={cn(
        "h-full bg-card shadow-sm transition-shadow hover:shadow-md",
        isActive && "border-primary/40 bg-primary/5 ring-1 ring-primary/15"
      )}
    >
      <CardHeader>
        <CardTitle>{plan.name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction className="flex items-center gap-2">
          {isActive ? (
            <StatusBadge status="active" showDot>
              Active plan
            </StatusBadge>
          ) : null}
          <Badge variant={plan.has_pt ? "secondary" : "outline"}>
            {plan.has_pt ? "PT" : "Access"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-5">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="flex items-end gap-2">
            <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {formatMoney(plan.price)}
            </p>
            <p className="pb-1 text-sm text-muted-foreground">
              / {formatTerm(plan)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {buildFeatures(plan).map((feature) => (
            <div key={feature} className="flex items-start gap-2">
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Check aria-hidden="true" className="size-3.5" />
              </span>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
        {isActive && activeSubscription?.expires_at ? (
          <div className="rounded-lg border bg-background p-3">
            <p className="text-xs text-muted-foreground">Expires</p>
            <p className="font-medium">
              {date.format(new Date(activeSubscription.expires_at))}
            </p>
          </div>
        ) : null}
        <div className="mt-auto">
          {isActive ? (
            <MemberActionForm
              action={createMemberSubscription}
              submitLabel="Extend expiry"
              pendingLabel="Creating"
              buttonVariant="outline"
              buttonClassName="w-full"
            >
              <input type="hidden" name="packageId" value={plan.id} />
            </MemberActionForm>
          ) : (
            <MemberActionForm
              action={createMemberSubscription}
              submitLabel={plan.has_pt ? "Start PT setup" : "Subscribe"}
              pendingLabel="Creating"
              buttonVariant="outline"
              buttonClassName="w-full"
            >
              <input type="hidden" name="packageId" value={plan.id} />
            </MemberActionForm>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export async function MemberMembershipsPage() {
  const supabase = await createClient()
  const [packagesResult, activeSubscriptionsResult] = await Promise.all([
    supabase
      .from("membership_packages")
      .select(
        "id,name,description,price,has_pt,duration_days,session_count,gym_facilities(name)"
      )
      .eq("status", "active")
      .order("has_pt", { ascending: true })
      .order("price", { ascending: true }),
    supabase
      .from("membership_subscriptions")
      .select("id,package_id,status,expires_at")
      .eq("status", "active"),
  ])

  const packages = (packagesResult.data ?? []) as unknown as PackageRow[]
  const activeSubscriptions = (activeSubscriptionsResult.data ??
    []) as unknown as ActiveSubscriptionRow[]
  const activeSubscriptionsByPackage = activeSubscriptions.reduce(
    (map, subscription) => {
      const current = map.get(subscription.package_id)
      const currentTime = current?.expires_at
        ? new Date(current.expires_at).getTime()
        : 0
      const subscriptionTime = subscription.expires_at
        ? new Date(subscription.expires_at).getTime()
        : 0

      if (!current || subscriptionTime >= currentTime) {
        map.set(subscription.package_id, subscription)
      }

      return map
    },
    new Map<string, ActiveSubscriptionRow>()
  )
  const error = packagesResult.error ?? activeSubscriptionsResult.error

  return (
    <PageShell
      eyebrow="Member"
      title="Membership Plans"
      description="Choose an access package or start a PT package setup."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Plans could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {packages.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((plan) => (
            <MemberPlanCard
              key={plan.id}
              plan={plan}
              activeSubscription={
                activeSubscriptionsByPackage.get(plan.id) ?? null
              }
            />
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageCheck />
            </EmptyMedia>
            <EmptyTitle>No active plans available</EmptyTitle>
            <EmptyDescription>
              Active membership packages will appear here when available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Dumbbell data-icon="inline-start" />
        PT package flow: subscribe, save preferences, wait for manager
        assignment, accept the PT, then pay from{" "}
        <Link href="/subscriptions" className="font-medium underline">
          Subscriptions
        </Link>
        .
      </div>
    </PageShell>
  )
}
