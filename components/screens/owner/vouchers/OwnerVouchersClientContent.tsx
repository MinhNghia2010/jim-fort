"use client"

import { useState } from "react"
import { CircleDollarSign, Tag, TicketCheck } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import { OwnerVouchersTable } from "@/components/screens/owner/vouchers/OwnerVouchersTable"
import type { OwnerVouchersPageProps } from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterLabel,
  matchesTableMonthFilter,
} from "@/components/TableMonthFilter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

export function OwnerVouchersClientContent({
  facilityLabel,
  vouchers,
  activeVoucherCount,
  redeemedVoucherCount,
  discountImpactLabel,
  errorMessage,
  canManage = true,
}: OwnerVouchersPageProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const summaryVouchers =
    monthFilter === ALL_MONTHS_VALUE
      ? vouchers
      : vouchers.filter((voucher) =>
          matchesTableMonthFilter(
            voucher.startsAt,
            monthFilter,
            "Asia/Ho_Chi_Minh"
          )
        )
  const selectedActiveVoucherCount = summaryVouchers.filter(
    (voucher) => voucher.status === "active"
  ).length
  const selectedRedemptionCount = summaryVouchers.reduce(
    (total, voucher) => total + voucher.usage,
    0
  )
  const selectedDiscountImpact = summaryVouchers.reduce(
    (total, voucher) => total + voucher.discountImpact,
    0
  )
  const isAllMonths = monthFilter === ALL_MONTHS_VALUE
  const selectedMonthLabel = getTableMonthFilterLabel(
    monthFilter,
    "Selected month"
  )

  return (
    <PageShell
      eyebrow={facilityLabel}
      title="Vouchers"
      description="Discount codes, launch windows, quantities, and redemption impact."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Voucher data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Available vouchers"
          value={isAllMonths ? activeVoucherCount : selectedActiveVoucherCount}
          description={
            isAllMonths
              ? "Active and currently redeemable"
              : `Active in ${selectedMonthLabel}`
          }
          icon={Tag}
        />
        <SummaryCard
          title="Redemptions"
          value={isAllMonths ? redeemedVoucherCount : selectedRedemptionCount}
          description={
            isAllMonths
              ? "Total voucher redemptions"
              : `Redemptions in ${selectedMonthLabel}`
          }
          icon={TicketCheck}
        />
        <SummaryCard
          title="Discount impact"
          value={
            isAllMonths
              ? discountImpactLabel
              : currencyFormatter.format(selectedDiscountImpact)
          }
          description={
            isAllMonths
              ? "Total value from voucher redemptions"
              : `Impact in ${selectedMonthLabel}`
          }
          icon={CircleDollarSign}
        />
      </div>

      <OwnerVouchersTable
        vouchers={vouchers}
        canManage={canManage}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
      />
    </PageShell>
  )
}
