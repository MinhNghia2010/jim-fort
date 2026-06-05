import type { CSSProperties } from "react"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import {
  Check,
  CircleDollarSign,
  CirclePlus,
  CreditCard,
  PackageCheck,
  Pencil,
  Users,
} from "lucide-react"

import { getMembershipsPageData } from "@/app/(main)/memberships/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import {
  MembershipDistributionChart,
  type MembershipDistributionItem,
} from "@/components/screens/owner/memberships/MembershipDistributionChart"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
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
import { cn } from "@/lib/utils"

export interface MembershipPlanView {
  id: string
  name: string
  description: string
  priceLabel: string
  termLabel: string
  status: "active" | "inactive" | "archived"
  features: readonly string[]
  activeMembers: number
  revenueLabel: string
  color: string
}

export interface OwnerMembershipsPageProps {
  facilityLabel: string
  plans: readonly MembershipPlanView[]
  distribution: readonly MembershipDistributionItem[]
  activeMembers: number
  activeMembersDetail: string
  revenueThisMonth: string
  revenueDetail: string
  errorMessage?: string
  canManage?: boolean
}

type PlanAccentStyle = CSSProperties & {
  [key: `--${string}`]: string | number | undefined
}

const planStatusGroups = [
  { status: "active", label: "Active" },
  { status: "inactive", label: "Inactive" },
  { status: "archived", label: "Archived" },
] as const satisfies readonly {
  status: MembershipPlanView["status"]
  label: string
}[]

function statusVariant(status: MembershipPlanView["status"]) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

function getPlanAccentStyle(color: string): PlanAccentStyle {
  return {
    "--plan-color": color,
  }
}

function PlanStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-background/80 p-3 ring-1 ring-foreground/10">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: color }}
      >
        <Icon className="size-4 text-white" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-medium tabular-nums">
          {value}
        </p>
      </div>
    </div>
  )
}

function PlanCard({
  plan,
  canManage,
}: {
  plan: MembershipPlanView
  canManage: boolean
}) {
  return (
    <Card
      style={getPlanAccentStyle(plan.color)}
      className="relative border-0 bg-card/95 shadow-sm ring-1 ring-foreground/10 transition-all hover:-translate-y-0.5 hover:shadow-md"
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
        <CardDescription>{plan.description}</CardDescription>
        <CardAction>
          <Badge
            variant={statusVariant(plan.status)}
            className="border-[color:var(--plan-color)] bg-[color-mix(in_srgb,var(--plan-color)_12%,transparent)] text-[color:var(--plan-color)] capitalize"
          >
            {plan.status}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="relative flex flex-col gap-5">
        <div className="rounded-2xl bg-[color-mix(in_srgb,var(--plan-color)_9%,transparent)] p-4 ring-1 ring-[color-mix(in_srgb,var(--plan-color)_18%,transparent)]">
          <div className="flex items-end gap-2">
            <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums">
              {plan.priceLabel}
            </p>
            <p className="pb-1 text-sm text-muted-foreground">
              / {plan.termLabel}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {plan.features.map((feature) => (
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
      </CardContent>
      <CardFooter
        className={cn(
          "relative grid grid-cols-1 gap-3 bg-[color-mix(in_srgb,var(--plan-color)_7%,var(--muted))]",
          canManage ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-2"
        )}
      >
        <PlanStat
          icon={Users}
          label="Active members"
          value={plan.activeMembers}
          color={plan.color}
        />
        <PlanStat
          icon={CreditCard}
          label="Paid revenue this month"
          value={plan.revenueLabel}
          color={plan.color}
        />
        {canManage ? (
          <Button
            variant="outline"
            size="sm"
            asChild
            className="rounded-full border-[color:var(--plan-color)] bg-background/90 px-4 text-[color:var(--plan-color)] shadow-sm hover:bg-[var(--plan-color)] hover:text-white sm:self-center"
          >
            <Link href={`/memberships/edit?planId=${plan.id}`}>
              <Pencil aria-hidden="true" data-icon="inline-start" />
              Edit plan
            </Link>
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  )
}

export function OwnerMembershipsContent({
  facilityLabel,
  plans,
  distribution,
  activeMembers,
  activeMembersDetail,
  revenueThisMonth,
  revenueDetail,
  errorMessage,
  canManage = true,
}: OwnerMembershipsPageProps) {
  const groupedPlans = planStatusGroups
    .map((group) => ({
      ...group,
      plans: plans.filter((plan) => plan.status === group.status),
    }))
    .filter((group) => group.plans.length > 0)

  return (
    <PageShell
      eyebrow={facilityLabel}
      title="Memberships"
      description="Plans, pricing, member distribution, and paid package revenue."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Membership data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ManagementMetricCard
          title="Active members"
          value={activeMembers}
          detail={activeMembersDetail}
          icon={Users}
        />
        <ManagementMetricCard
          title="Paid revenue this month"
          value={revenueThisMonth}
          detail={revenueDetail}
          icon={CircleDollarSign}
        />
        <Card size="sm" className="md:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle className="text-xs font-normal text-muted-foreground">
              Active member distribution
            </CardTitle>
            <CardAction className="text-muted-foreground">
              <PackageCheck aria-hidden="true" className="size-4" />
            </CardAction>
          </CardHeader>
          <CardContent className="flex min-h-32 items-center gap-4">
            {distribution.length ? (
              <>
                <MembershipDistributionChart data={distribution} />
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {distribution.map((item) => (
                    <div
                      key={item.name}
                      className="flex min-w-0 items-center gap-2 text-xs"
                    >
                      <span
                        aria-hidden="true"
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-muted-foreground">
                        {item.name}
                      </span>
                      <span className="ml-auto font-mono font-medium tabular-nums">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No active member distribution is available yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-lg font-semibold tracking-tight">
            Membership plans
          </h2>
          <p className="text-sm text-muted-foreground">
            Current packages offered by this facility.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{plans.length} plans</Badge>
          {canManage ? (
            <Button asChild size="sm">
              <Link href="/memberships/create">
                <CirclePlus data-icon="inline-start" />
                Create membership
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      {plans.length ? (
        <div className="flex flex-col gap-6">
          {groupedPlans.map((group) => (
            <div key={group.status} className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-heading text-base font-semibold tracking-tight">
                  {group.label}
                </h3>
                <Badge variant={statusVariant(group.status)}>
                  {group.plans.length}{" "}
                  {group.plans.length === 1 ? "plan" : "plans"}
                </Badge>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {group.plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} canManage={canManage} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <PackageCheck />
                </EmptyMedia>
                <EmptyTitle>No membership plans found</EmptyTitle>
                <EmptyDescription>
                  Plans from the live membership_packages table will appear
                  here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}

export async function OwnerMembershipsPage() {
  const membershipsPageProps = await getMembershipsPageData()

  return <OwnerMembershipsContent {...membershipsPageProps} />
}
