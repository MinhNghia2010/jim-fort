import { getMembershipsPageData } from "@/app/(main)/memberships/data"
import { OwnerMembershipsClientContent } from "@/components/screens/owner/memberships/OwnerMembershipsClientContent"

export interface MembershipPlanMonthStats {
  monthKey: string
  activeMembers: number
  revenue: number
  paymentCount: number
}

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
  monthlyStats: readonly MembershipPlanMonthStats[]
}

export interface MembershipMonthSummary {
  monthKey: string
  monthLabel: string
  activeMembers: number
  ptMembers: number
  nonPtMembers: number
  activations: number
  ptActivations: number
  nonPtActivations: number
  revenue: number
  paymentCount: number
}

export interface OwnerMembershipsPageProps {
  facilityLabel: string
  plans: readonly MembershipPlanView[]
  monthlySummaries: readonly MembershipMonthSummary[]
  activeMembers: number
  ptMembers: number
  nonPtMembers: number
  activeMembersDetail: string
  revenueThisMonth: string
  revenueDetail: string
  errorMessage?: string
  canManage?: boolean
}

export function OwnerMembershipsContent({
  facilityLabel,
  plans,
  monthlySummaries,
  activeMembers,
  ptMembers,
  nonPtMembers,
  activeMembersDetail,
  revenueThisMonth,
  revenueDetail,
  errorMessage,
  canManage = true,
}: OwnerMembershipsPageProps) {
  return (
    <OwnerMembershipsClientContent
      facilityLabel={facilityLabel}
      plans={plans}
      monthlySummaries={monthlySummaries}
      activeMembers={activeMembers}
      ptMembers={ptMembers}
      nonPtMembers={nonPtMembers}
      activeMembersDetail={activeMembersDetail}
      revenueThisMonth={revenueThisMonth}
      revenueDetail={revenueDetail}
      errorMessage={errorMessage}
      canManage={canManage}
    />
  )
}

export async function OwnerMembershipsPage() {
  const membershipsPageProps = await getMembershipsPageData()

  return <OwnerMembershipsContent {...membershipsPageProps} />
}
