"use client"

import { useState } from "react"
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

const memberSortOptions = [
  { value: "member_asc", label: "A-Z" },
  { value: "member_desc", label: "Z-A" },
] as const

const planSortOptions = [
  { value: "plan_asc", label: "A-Z" },
  { value: "plan_desc", label: "Z-A" },
] as const

const discountSortOptions = [
  { value: "discount_desc", label: "High-Low" },
  { value: "discount_asc", label: "Low-High" },
] as const

const redeemedSortOptions = [
  { value: "redeemed_desc", label: "Latest" },
  { value: "redeemed_asc", label: "Oldest" },
] as const

type RedemptionSort =
  | (typeof memberSortOptions)[number]["value"]
  | (typeof planSortOptions)[number]["value"]
  | (typeof discountSortOptions)[number]["value"]
  | (typeof redeemedSortOptions)[number]["value"]

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function getDateValue(value: string | null, nullValue: number) {
  return value ? new Date(value).getTime() : nullValue
}

function sortRedemptions(
  redemptions: VoucherRedemptionView[],
  sort: RedemptionSort
) {
  return [...redemptions].sort((first, second) => {
    if (sort === "member_asc") {
      return compareText(first.memberName, second.memberName)
    }

    if (sort === "member_desc") {
      return compareText(second.memberName, first.memberName)
    }

    if (sort === "plan_asc") {
      return compareText(first.membershipPlanName, second.membershipPlanName)
    }

    if (sort === "plan_desc") {
      return compareText(second.membershipPlanName, first.membershipPlanName)
    }

    if (sort === "discount_asc") {
      return first.discountAmount - second.discountAmount
    }

    if (sort === "redeemed_asc") {
      return getDateValue(first.redeemedAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.redeemedAt, Number.MAX_SAFE_INTEGER)
    }

    if (sort === "redeemed_desc") {
      return getDateValue(second.redeemedAt, 0) -
        getDateValue(first.redeemedAt, 0)
    }

    return second.discountAmount - first.discountAmount
  })
}

export function OwnerVoucherRedemptionsTable({
  redemptions,
}: OwnerVoucherRedemptionsTableProps) {
  const [sort, setSort] = useState<RedemptionSort>("redeemed_desc")
  const sortedRedemptions = sortRedemptions([...redemptions], sort)
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const planSortValue =
    sort === "plan_desc" || sort === "plan_asc" ? sort : "plan_asc"
  const discountSortValue =
    sort === "discount_asc" || sort === "discount_desc"
      ? sort
      : "discount_desc"
  const redeemedSortValue =
    sort === "redeemed_asc" || sort === "redeemed_desc"
      ? sort
      : "redeemed_desc"

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">
            <OwnerTableHeaderSelect
              label="Member"
              value={memberSortValue}
              options={memberSortOptions}
              onValueChange={setSort}
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              label="Membership plan"
              value={planSortValue}
              options={planSortOptions}
              onValueChange={setSort}
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              label="Discount"
              value={discountSortValue}
              options={discountSortOptions}
              onValueChange={setSort}
            />
          </TableHead>
          <TableHead className="pr-4">
            <OwnerTableHeaderSelect
              label="Redeemed"
              value={redeemedSortValue}
              options={redeemedSortOptions}
              onValueChange={setSort}
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
