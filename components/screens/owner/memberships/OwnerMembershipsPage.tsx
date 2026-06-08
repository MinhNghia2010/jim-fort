import { CircleDollarSign, PackageCheck, Users } from "lucide-react"

import { getMembershipsPageData } from "@/app/(main)/memberships/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import {
  MembershipDistributionChart,
  type MembershipDistributionItem,
} from "@/components/screens/owner/memberships/MembershipDistributionChart"
import { OwnerMembershipsTable } from "@/components/screens/owner/memberships/OwnerMembershipsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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

      <OwnerMembershipsTable plans={plans} canManage={canManage} />
    </PageShell>
  )
}

export async function OwnerMembershipsPage() {
  const membershipsPageProps = await getMembershipsPageData()

  return <OwnerMembershipsContent {...membershipsPageProps} />
}
