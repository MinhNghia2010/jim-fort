import {
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
} from "lucide-react"

import { getOwnerRevenuePageData } from "@/app/(main)/revenue/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
<<<<<<< HEAD
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
=======
import { OwnerRevenueTable } from "@/components/screens/owner/revenue/OwnerRevenueTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
<<<<<<< HEAD
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
=======
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd

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

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Membership subscription payments</CardTitle>
          <CardDescription>
            Paid membership payment records from the live subscription flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
<<<<<<< HEAD
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Paid at</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="pr-4 text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="px-4 font-mono text-xs text-muted-foreground">
                      {row.paidAtLabel}
                    </TableCell>
                    <TableCell>
                      <div className="min-w-40">
                        <p className="truncate font-medium">
                          {row.memberName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {row.memberPhone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{row.packageName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.methodLabel}
                    </TableCell>
                    <TableCell className="pr-4 text-right font-mono font-medium tabular-nums">
                      {row.amountLabel}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-64 rounded-none border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptText />
                </EmptyMedia>
                <EmptyTitle>No paid membership subscriptions yet</EmptyTitle>
                <EmptyDescription>
                  Paid subscription payments will appear here once members
                  complete checkout.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
=======
          <OwnerRevenueTable rows={rows} />
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerRevenuePage() {
  const revenuePageProps = await getOwnerRevenuePageData()

  return <OwnerRevenueContent {...revenuePageProps} />
}
