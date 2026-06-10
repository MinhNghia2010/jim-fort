import { getOwnerRevenuePageData } from "@/app/(main)/revenue/data"
import { OwnerRevenueClientContent } from "@/components/screens/owner/revenue/OwnerRevenueClientContent"

export interface RevenueHistoryRow {
  id: string
  type: "Membership subscription"
  memberName: string
  memberPhone: string
  packageName: string
  subscriptionStatus: string
  methodLabel: string
  paidAt: string | null
  paidAtLabel: string
  paidDateKey: string
  amount: number
  amountLabel: string
}

export interface OwnerRevenuePageProps {
  rows: readonly RevenueHistoryRow[]
  todayTotalLabel: string
  monthTotalLabel: string
  yearTotalLabel: string
  membershipPaymentCount: number
  errorMessage?: string
}

export function OwnerRevenueContent({
  rows,
  todayTotalLabel,
  monthTotalLabel,
  yearTotalLabel,
  membershipPaymentCount,
  errorMessage,
}: OwnerRevenuePageProps) {
  return (
    <OwnerRevenueClientContent
      rows={rows}
      todayTotalLabel={todayTotalLabel}
      monthTotalLabel={monthTotalLabel}
      yearTotalLabel={yearTotalLabel}
      membershipPaymentCount={membershipPaymentCount}
      errorMessage={errorMessage}
    />
  )
}

export async function OwnerRevenuePage() {
  const revenuePageProps = await getOwnerRevenuePageData()

  return <OwnerRevenueContent {...revenuePageProps} />
}
