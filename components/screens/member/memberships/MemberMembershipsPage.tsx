import type { CSSProperties } from "react"
import Link from "next/link"
import { Check, Dumbbell, PackageCheck } from "lucide-react"

import { createMemberSubscription } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
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

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const planColors = [
  "var(--chart-1)",
  "var(--chart-5)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-2)",
] as const

type PlanAccentStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined
}

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

function getPlanAccentStyle(color: string): PlanAccentStyle {
  return {
    "--plan-color": color,
  }
}

function MemberPlanCard({
  plan,
  color,
}: {
  plan: PackageRow
  color: string
}) {
  const description =
    plan.description ??
    (plan.has_pt
      ? "Includes PT assignment, schedule approval, and session tracking."
      : "Facility access plan without personal training setup.")

  return (
    <Card
      style={getPlanAccentStyle(color)}
      className="relative h-full border-0 bg-card/95 shadow-sm ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--plan-color),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute -top-10 -right-8 size-32 rounded-full bg-[var(--plan-color)] opacity-10"
      />
      <div
        aria-hidden="true"
        className="absolute right-10 bottom-14 size-20 rounded-full bg-[var(--plan-color)] opacity-5"
      />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-full bg-[var(--plan-color)] shadow-[0_0_0_4px_color-mix(in_srgb,var(--plan-color)_14%,transparent)]"
          />
          {plan.name}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <Badge
            variant={plan.has_pt ? "default" : "secondary"}
            className="border-[color:var(--plan-color)] bg-[color-mix(in_srgb,var(--plan-color)_12%,transparent)] text-[color:var(--plan-color)]"
          >
            {plan.has_pt ? "PT" : "Access"}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="relative flex flex-1 flex-col gap-5">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--plan-color)_9%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--plan-color)_18%,transparent)]">
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
              <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--plan-color)_14%,transparent)]">
                <Check
                  aria-hidden="true"
                  className="size-3.5 text-[color:var(--plan-color)]"
                />
              </span>
              <span className="text-sm text-muted-foreground">{feature}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto">
          <MemberActionForm
            action={createMemberSubscription}
            submitLabel={plan.has_pt ? "Start PT setup" : "Subscribe"}
            pendingLabel="Creating"
            buttonVariant="outline"
            buttonClassName="w-full rounded-full border-[color:var(--plan-color)] bg-background/90 px-4 text-[color:var(--plan-color)] shadow-sm hover:bg-[var(--plan-color)] hover:text-white"
          >
            <input type="hidden" name="packageId" value={plan.id} />
          </MemberActionForm>
        </div>
      </CardContent>
    </Card>
  )
}

export async function MemberMembershipsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_packages")
    .select(
      "id,name,description,price,has_pt,duration_days,session_count,gym_facilities(name)"
    )
    .eq("status", "active")
    .order("has_pt", { ascending: true })
    .order("price", { ascending: true })

  const packages = (data ?? []) as unknown as PackageRow[]

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
          {packages.map((plan, index) => (
            <MemberPlanCard
              key={plan.id}
              plan={plan}
              color={planColors[index % planColors.length]}
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
        PT package flow: subscribe, save preferences, wait for manager assignment,
        accept the PT, then pay from{" "}
        <Link href="/subscriptions" className="font-medium underline">
          Subscriptions
        </Link>
        .
      </div>
    </PageShell>
  )
}
