"use client"

import { useState } from "react"
import {
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import { OwnerRevenueTable } from "@/components/screens/owner/revenue/OwnerRevenueTable"
import type {
  OwnerRevenuePageProps,
  RevenueHistoryRow,
} from "@/components/screens/owner/revenue/OwnerRevenuePage"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterLabel,
  getTableMonthKey,
} from "@/components/TableMonthFilter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function sumRows(rows: readonly RevenueHistoryRow[]) {
  return rows.reduce((total, row) => total + row.amount, 0)
}

function filterRowsByMonth(
  rows: readonly RevenueHistoryRow[],
  monthFilter: string
) {
  return rows.filter((row) => row.paidDateKey.startsWith(monthFilter))
}

function filterRowsByYear(
  rows: readonly RevenueHistoryRow[],
  monthFilter: string
) {
  const year = monthFilter.slice(0, 4)

  return rows.filter((row) => row.paidDateKey.startsWith(year))
}

export function OwnerRevenueClientContent({
  rows,
  todayTotalLabel,
  monthTotalLabel,
  yearTotalLabel,
  membershipPaymentCount,
  errorMessage,
}: OwnerRevenuePageProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const selectedMonthRows =
    monthFilter === ALL_MONTHS_VALUE
      ? rows
      : filterRowsByMonth(rows, monthFilter)
  const selectedYearRows =
    monthFilter === ALL_MONTHS_VALUE
      ? rows
      : filterRowsByYear(rows, monthFilter)
  const selectedMonthTotal = sumRows(selectedMonthRows)
  const selectedYearTotal = sumRows(selectedYearRows)
  const selectedAverage =
    selectedMonthRows.length > 0
      ? selectedMonthTotal / selectedMonthRows.length
      : 0
  const isAllMonths = monthFilter === ALL_MONTHS_VALUE
  const currentMonthLabel = getTableMonthFilterLabel(
    getTableMonthKey(new Date().toISOString()) ?? ALL_MONTHS_VALUE,
    "This month"
  )
  const selectedMonthLabel = getTableMonthFilterLabel(
    monthFilter,
    "Selected month"
  )
  const selectedYearLabel = monthFilter.slice(0, 4)

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
        <SummaryCard
          title={isAllMonths ? "Today" : selectedMonthLabel}
          value={
            isAllMonths
              ? todayTotalLabel
              : currencyFormatter.format(selectedMonthTotal)
          }
          description="Paid membership subscriptions"
          icon={CalendarDays}
        />
        <SummaryCard
          title={isAllMonths ? currentMonthLabel : `${selectedYearLabel} total`}
          value={
            isAllMonths
              ? monthTotalLabel
              : currencyFormatter.format(selectedYearTotal)
          }
          description="Paid membership subscriptions"
          icon={CircleDollarSign}
        />
        <SummaryCard
          title={isAllMonths ? "This year" : "Average payment"}
          value={
            isAllMonths
              ? yearTotalLabel
              : currencyFormatter.format(selectedAverage)
          }
          description="Paid membership subscriptions"
          icon={ReceiptText}
        />
        <SummaryCard
          title="Membership payments"
          value={
            isAllMonths ? membershipPaymentCount : selectedMonthRows.length
          }
          description={
            isAllMonths
              ? "Total paid subscription records"
              : `Paid records in ${selectedMonthLabel}`
          }
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
          <OwnerRevenueTable
            rows={rows}
            monthFilter={monthFilter}
            onMonthFilterChange={setMonthFilter}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
