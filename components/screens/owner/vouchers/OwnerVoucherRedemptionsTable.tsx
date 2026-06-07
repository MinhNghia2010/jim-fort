"use client"

import { useMemo, useState } from "react"
import { TicketCheck } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type { VoucherRedemptionView } from "@/components/screens/owner/vouchers/OwnerVoucherDetailPage"
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

interface OwnerVoucherRedemptionsTableProps {
  redemptions: readonly VoucherRedemptionView[]
}

type RedemptionSortOption =
  | "member_az"
  | "member_za"
  | "plan_az"
  | "plan_za"
  | "discount_high"
  | "discount_low"
  | "redeemed_latest"
  | "redeemed_oldest"

const memberSortOptions = [
  { value: "member_az", label: "Member: A-Z" },
  { value: "member_za", label: "Member: Z-A" },
] as const

const planSortOptions = [
  { value: "plan_az", label: "Membership plan: A-Z" },
  { value: "plan_za", label: "Membership plan: Z-A" },
] as const

const discountSortOptions = [
  { value: "discount_high", label: "Discount: High-Low" },
  { value: "discount_low", label: "Discount: Low-High" },
] as const

const redeemedSortOptions = [
  { value: "redeemed_latest", label: "Redeemed: Latest" },
  { value: "redeemed_oldest", label: "Redeemed: Oldest" },
] as const

const redemptionSortValues: readonly RedemptionSortOption[] = [
  "member_az",
  "member_za",
  "plan_az",
  "plan_za",
  "discount_high",
  "discount_low",
  "redeemed_latest",
  "redeemed_oldest",
]

function isRedemptionSortOption(value: string): value is RedemptionSortOption {
  return redemptionSortValues.includes(value as RedemptionSortOption)
}

function getHeaderSortValue(
  sortOption: RedemptionSortOption,
  values: readonly RedemptionSortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: RedemptionSortOption,
  options: readonly { value: RedemptionSortOption; label: string }[],
  fallback: string
) {
  return (
    options.find((option) => option.value === sortOption)?.label ?? fallback
  )
}

function getTime(value: string | null) {
  if (!value) {
    return null
  }

  const time = Date.parse(value)

  return Number.isFinite(time) ? time : null
}

function compareNullableTime(
  first: string | null,
  second: string | null,
  direction: "ascending" | "descending"
) {
  const firstTime = getTime(first)
  const secondTime = getTime(second)

  if (firstTime === null && secondTime === null) {
    return 0
  }

  if (firstTime === null) {
    return 1
  }

  if (secondTime === null) {
    return -1
  }

  return direction === "descending"
    ? secondTime - firstTime
    : firstTime - secondTime
}

function sortRedemptions(
  redemptions: readonly VoucherRedemptionView[],
  sortOption: RedemptionSortOption
) {
  return [...redemptions].sort((first, second) => {
    if (sortOption === "member_az") {
      return first.memberName.localeCompare(second.memberName)
    }

    if (sortOption === "member_za") {
      return second.memberName.localeCompare(first.memberName)
    }

    if (sortOption === "plan_az") {
      return first.membershipPlanName.localeCompare(second.membershipPlanName)
    }

    if (sortOption === "plan_za") {
      return second.membershipPlanName.localeCompare(first.membershipPlanName)
    }

    if (sortOption === "discount_high") {
      return second.discountAmount - first.discountAmount
    }

    if (sortOption === "discount_low") {
      return first.discountAmount - second.discountAmount
    }

    if (sortOption === "redeemed_latest") {
      return compareNullableTime(
        first.redeemedAt,
        second.redeemedAt,
        "descending"
      )
    }

    return compareNullableTime(first.redeemedAt, second.redeemedAt, "ascending")
  })
}

export function OwnerVoucherRedemptionsTable({
  redemptions,
}: OwnerVoucherRedemptionsTableProps) {
  const [sortOption, setSortOption] =
    useState<RedemptionSortOption>("redeemed_latest")
  const updateSortOption = (value: string) => {
    if (isRedemptionSortOption(value)) {
      setSortOption(value)
    }
  }
  const sortedRedemptions = useMemo(
    () => sortRedemptions(redemptions, sortOption),
    [redemptions, sortOption]
  )

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["member_az", "member_za"],
                "member"
              )}
              label={getSortLabel(sortOption, memberSortOptions, "Member")}
              options={[
                { value: "member", label: "Member", disabled: true },
                ...memberSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort redemption members"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["plan_az", "plan_za"],
                "plan"
              )}
              label={getSortLabel(
                sortOption,
                planSortOptions,
                "Membership plan"
              )}
              options={[
                {
                  value: "plan",
                  label: "Membership plan",
                  disabled: true,
                },
                ...planSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort redemption membership plans"
              className="w-56"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["discount_high", "discount_low"],
                "discount"
              )}
              label={getSortLabel(sortOption, discountSortOptions, "Discount")}
              options={[
                { value: "discount", label: "Discount", disabled: true },
                ...discountSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort redemption discounts"
              className="w-44"
            />
          </TableHead>
          <TableHead className="pr-4">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["redeemed_latest", "redeemed_oldest"],
                "redeemed"
              )}
              label={getSortLabel(sortOption, redeemedSortOptions, "Redeemed")}
              options={[
                { value: "redeemed", label: "Redeemed", disabled: true },
                ...redeemedSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort redemption dates"
              className="w-44"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRedemptions.length ? (
          sortedRedemptions.map((redemption) => (
            <TableRow key={redemption.id}>
              <TableCell className="px-4 font-medium">
                {redemption.memberName}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {redemption.membershipPlanName}
              </TableCell>
              <TableCell className="font-medium">
                {redemption.discountAmountLabel}
              </TableCell>
              <TableCell className="pr-4 font-mono text-xs text-muted-foreground">
                {redemption.redeemedAtLabel}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={4} className="h-64">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <TicketCheck />
                  </EmptyMedia>
                  <EmptyTitle>No redemptions yet</EmptyTitle>
                  <EmptyDescription>
                    This voucher has not been redeemed by a subscription.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
