"use client"

import { useState } from "react"
import { ReceiptText } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type { RevenueHistoryRow } from "@/components/screens/owner/revenue/OwnerRevenuePage"
import {
  TablePagination,
  TABLE_ROWS_PER_PAGE,
} from "@/components/TablePagination"
import { Badge } from "@/components/ui/badge"
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

interface OwnerRevenueTableProps {
  rows: readonly RevenueHistoryRow[]
}

const paidAtSortOptions = [
  { value: "paid_desc", label: "Latest" },
  { value: "paid_asc", label: "Oldest" },
] as const

const memberSortOptions = [
  { value: "member_asc", label: "A-Z" },
  { value: "member_desc", label: "Z-A" },
] as const

const packageSortOptions = [
  { value: "package_asc", label: "A-Z" },
  { value: "package_desc", label: "Z-A" },
] as const

const sourceSortOptions = [
  { value: "source_asc", label: "A-Z" },
  { value: "source_desc", label: "Z-A" },
] as const

const methodSortOptions = [
  { value: "method_asc", label: "A-Z" },
  { value: "method_desc", label: "Z-A" },
] as const

const amountSortOptions = [
  { value: "amount_desc", label: "High-Low" },
  { value: "amount_asc", label: "Low-High" },
] as const

type RevenueSort =
  | (typeof paidAtSortOptions)[number]["value"]
  | (typeof memberSortOptions)[number]["value"]
  | (typeof packageSortOptions)[number]["value"]
  | (typeof sourceSortOptions)[number]["value"]
  | (typeof methodSortOptions)[number]["value"]
  | (typeof amountSortOptions)[number]["value"]

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function getDateValue(value: string | null, nullValue: number) {
  return value ? new Date(value).getTime() : nullValue
}

function sortRevenueRows(rows: RevenueHistoryRow[], sort: RevenueSort) {
  return [...rows].sort((first, second) => {
    if (sort === "paid_asc") {
      return (
        getDateValue(first.paidAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.paidAt, Number.MAX_SAFE_INTEGER)
      )
    }

    if (sort === "member_asc") {
      return compareText(first.memberName, second.memberName)
    }

    if (sort === "member_desc") {
      return compareText(second.memberName, first.memberName)
    }

    if (sort === "package_asc") {
      return compareText(first.packageName, second.packageName)
    }

    if (sort === "package_desc") {
      return compareText(second.packageName, first.packageName)
    }

    if (sort === "source_asc") {
      return compareText(first.type, second.type)
    }

    if (sort === "source_desc") {
      return compareText(second.type, first.type)
    }

    if (sort === "method_asc") {
      return compareText(first.methodLabel, second.methodLabel)
    }

    if (sort === "method_desc") {
      return compareText(second.methodLabel, first.methodLabel)
    }

    if (sort === "amount_asc") {
      return first.amount - second.amount
    }

    if (sort === "amount_desc") {
      return second.amount - first.amount
    }

    return getDateValue(second.paidAt, 0) - getDateValue(first.paidAt, 0)
  })
}

export function OwnerRevenueTable({ rows }: OwnerRevenueTableProps) {
  const [sort, setSort] = useState<RevenueSort>("paid_desc")
  const [currentPage, setCurrentPage] = useState(1)
  const sortedRows = sortRevenueRows([...rows], sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedRows.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedRows = sortedRows.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedRows.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedRows.length
  )
  const paidAtSortValue =
    sort === "paid_asc" || sort === "paid_desc" ? sort : "paid_desc"
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const packageSortValue =
    sort === "package_desc" || sort === "package_asc" ? sort : "package_asc"
  const sourceSortValue =
    sort === "source_desc" || sort === "source_asc" ? sort : "source_asc"
  const methodSortValue =
    sort === "method_desc" || sort === "method_asc" ? sort : "method_asc"
  const amountSortValue =
    sort === "amount_asc" || sort === "amount_desc" ? sort : "amount_desc"

  function handleSortChange(value: RevenueSort) {
    setSort(value)
    setCurrentPage(1)
  }

  return (
    <>
      <Table className="min-w-[1100px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <colgroup>
          <col className="w-[13rem]" />
          <col className="w-[17rem]" />
          <col className="w-[17rem]" />
          <col className="w-[14rem]" />
          <col className="w-[12rem]" />
          <col className="w-[10rem]" />
        </colgroup>
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">
              <OwnerTableHeaderSelect
                label="Paid at"
                value={paidAtSortValue}
                options={paidAtSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Member"
                value={memberSortValue}
                options={memberSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Package"
                value={packageSortValue}
                options={packageSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Source"
                value={sourceSortValue}
                options={sourceSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Method"
                value={methodSortValue}
                options={methodSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12 pr-6 text-right">
              <OwnerTableHeaderSelect
                label="Amount"
                value={amountSortValue}
                options={amountSortOptions}
                onValueChange={handleSortChange}
                className="ml-auto"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.length ? (
            paginatedRows.map((row) => (
              <TableRow key={row.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                  {row.paidAtLabel}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium break-words">{row.memberName}</p>
                    <p className="text-xs break-words text-muted-foreground">
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
                <TableCell className="pr-6 text-right font-mono font-medium tabular-nums">
                  {row.amountLabel}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-64">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ReceiptText />
                    </EmptyMedia>
                    <EmptyTitle>
                      No paid membership subscriptions yet
                    </EmptyTitle>
                    <EmptyDescription>
                      Paid subscription payments will appear here once members
                      complete checkout.
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
          Showing {visibleStart}-{visibleEnd} of {sortedRows.length} payments
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
