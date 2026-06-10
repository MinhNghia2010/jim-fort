import { CircleDollarSign, Users } from "lucide-react"

import { getMembershipsPageData } from "@/app/(main)/memberships/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerMembershipsTable } from "@/components/screens/owner/memberships/OwnerMembershipsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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
      description={
        canManage
          ? "Plans, pricing, active members, and paid package revenue."
          : "Plans, pricing, and paid package revenue."
      }
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Membership data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <OwnerMembershipsTable plans={plans} canManage={canManage} />
    </PageShell>
  )
}

export async function OwnerMembershipsPage() {
  const membershipsPageProps = await getMembershipsPageData()

  return <OwnerMembershipsContent {...membershipsPageProps} />
}
