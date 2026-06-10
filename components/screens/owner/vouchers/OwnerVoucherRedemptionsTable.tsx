"use client"

import { useState } from "react"
import { TicketCheck } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type { VoucherRedemptionView } from "@/components/screens/owner/vouchers/OwnerVoucherDetailPage"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterOptions,
  matchesTableMonthFilter,
  TableMonthFilter,
} from "@/components/TableMonthFilter"
import {
  TablePagination,
  TABLE_ROWS_PER_PAGE,
} from "@/components/TablePagination"
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
      return (
        getDateValue(first.redeemedAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.redeemedAt, Number.MAX_SAFE_INTEGER)
      )
    }

    if (sort === "redeemed_desc") {
      return (
        getDateValue(second.redeemedAt, 0) - getDateValue(first.redeemedAt, 0)
      )
    }

    return second.discountAmount - first.discountAmount
  })
}

export function OwnerVoucherRedemptionsTable({
  redemptions,
}: OwnerVoucherRedemptionsTableProps) {
  const [sort, setSort] = useState<RedemptionSort>("redeemed_desc")
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const [currentPage, setCurrentPage] = useState(1)
  const monthFilterOptions = getTableMonthFilterOptions(
    redemptions,
    (redemption) => redemption.redeemedAt
  )
  const filteredRedemptions = redemptions.filter((redemption) =>
    matchesTableMonthFilter(redemption.redeemedAt, monthFilter)
  )
  const sortedRedemptions = sortRedemptions([...filteredRedemptions], sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedRedemptions.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedRedemptions = sortedRedemptions.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedRedemptions.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedRedemptions.length
  )
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const planSortValue =
    sort === "plan_desc" || sort === "plan_asc" ? sort : "plan_asc"
  const discountSortValue =
    sort === "discount_asc" || sort === "discount_desc" ? sort : "discount_desc"
  const redeemedSortValue =
    sort === "redeemed_asc" || sort === "redeemed_desc" ? sort : "redeemed_desc"

  function handleSortChange(value: RedemptionSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleMonthFilterChange(value: string) {
    setMonthFilter(value)
    setCurrentPage(1)
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <TableMonthFilter
          value={monthFilter}
          options={monthFilterOptions}
          onValueChange={handleMonthFilterChange}
          label="Filter redemptions by redeemed month"
        />
      </div>
      <Table className="min-w-[780px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[36%]" />
          <col className="w-[12%]" />
          <col className="w-[18%]" />
        </colgroup>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">
              <OwnerTableHeaderSelect
                label="Member"
                value={memberSortValue}
                options={memberSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Membership plan"
                value={planSortValue}
                options={planSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Discount"
                value={discountSortValue}
                options={discountSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12 pr-6">
              <OwnerTableHeaderSelect
                label="Redeemed"
                value={redeemedSortValue}
                options={redeemedSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRedemptions.length ? (
            paginatedRedemptions.map((redemption) => (
              <TableRow key={redemption.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-medium">
                  {redemption.memberName}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {redemption.membershipPlanName}
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {redemption.discountAmountLabel}
                </TableCell>
                <TableCell className="pr-6 font-mono text-xs whitespace-nowrap text-muted-foreground">
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
      <div className="flex flex-col gap-3 border-t px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          Showing {visibleStart}-{visibleEnd} of {sortedRedemptions.length}{" "}
          redemptions
        </span>
        <TablePagination
          activePage={activePage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  )
}
