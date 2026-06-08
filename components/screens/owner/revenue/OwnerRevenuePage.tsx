import {
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
} from "lucide-react"

import { getOwnerRevenuePageData } from "@/app/(main)/revenue/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerRevenueTable } from "@/components/screens/owner/revenue/OwnerRevenueTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <PageShell
      title="Revenue History"
      description="Paid revenue history by day, month, and year. Starting with membership subscription payments."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Revenue data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Today"
          value={todayTotalLabel}
          detail="Paid membership subscriptions"
          icon={CalendarDays}
        />
        <ManagementMetricCard
          title="This month"
          value={monthTotalLabel}
          detail="Paid membership subscriptions"
          icon={CircleDollarSign}
        />
        <ManagementMetricCard
          title="This year"
          value={yearTotalLabel}
          detail="Paid membership subscriptions"
          icon={ReceiptText}
        />
        <ManagementMetricCard
          title="Membership payments"
          value={membershipPaymentCount}
          detail="Total paid subscription records"
          icon={CreditCard}
        />
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Membership subscription payments</CardTitle>
          <CardDescription>
            Paid membership payment records from the live subscription flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <OwnerRevenueTable rows={rows} />
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerRevenuePage() {
  const revenuePageProps = await getOwnerRevenuePageData()

  return <OwnerRevenueContent {...revenuePageProps} />
}
