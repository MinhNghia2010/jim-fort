"use client"

import { useMemo, useState } from "react"
import { ReceiptText } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type { RevenueHistoryRow } from "@/components/screens/owner/revenue/OwnerRevenuePage"
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

type RevenueSortOption =
  | "paid_latest"
  | "paid_oldest"
  | "member_az"
  | "member_za"
  | "package_az"
  | "package_za"
  | "source_az"
  | "source_za"
  | "method_az"
  | "method_za"
  | "amount_high"
  | "amount_low"

const paidSortOptions = [
  { value: "paid_latest", label: "Paid at: Latest" },
  { value: "paid_oldest", label: "Paid at: Oldest" },
] as const

const memberSortOptions = [
  { value: "member_az", label: "Member: A-Z" },
  { value: "member_za", label: "Member: Z-A" },
] as const

const packageSortOptions = [
  { value: "package_az", label: "Package: A-Z" },
  { value: "package_za", label: "Package: Z-A" },
] as const

const sourceSortOptions = [
  { value: "source_az", label: "Source: A-Z" },
  { value: "source_za", label: "Source: Z-A" },
] as const

const methodSortOptions = [
  { value: "method_az", label: "Method: A-Z" },
  { value: "method_za", label: "Method: Z-A" },
] as const

const amountSortOptions = [
  { value: "amount_high", label: "Amount: High-Low" },
  { value: "amount_low", label: "Amount: Low-High" },
] as const

const revenueSortValues: readonly RevenueSortOption[] = [
  "paid_latest",
  "paid_oldest",
  "member_az",
  "member_za",
  "package_az",
  "package_za",
  "source_az",
  "source_za",
  "method_az",
  "method_za",
  "amount_high",
  "amount_low",
]

function isRevenueSortOption(value: string): value is RevenueSortOption {
  return revenueSortValues.includes(value as RevenueSortOption)
}

function getHeaderSortValue(
  sortOption: RevenueSortOption,
  values: readonly RevenueSortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: RevenueSortOption,
  options: readonly { value: RevenueSortOption; label: string }[],
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

function sortRevenueRows(
  rows: readonly RevenueHistoryRow[],
  sortOption: RevenueSortOption
) {
  return [...rows].sort((first, second) => {
    if (sortOption === "paid_latest") {
      return compareNullableTime(first.paidAt, second.paidAt, "descending")
    }

    if (sortOption === "paid_oldest") {
      return compareNullableTime(first.paidAt, second.paidAt, "ascending")
    }

    if (sortOption === "member_az") {
      return first.memberName.localeCompare(second.memberName)
    }

    if (sortOption === "member_za") {
      return second.memberName.localeCompare(first.memberName)
    }

    if (sortOption === "package_az") {
      return first.packageName.localeCompare(second.packageName)
    }

    if (sortOption === "package_za") {
      return second.packageName.localeCompare(first.packageName)
    }

    if (sortOption === "source_az") {
      return first.type.localeCompare(second.type)
    }

    if (sortOption === "source_za") {
      return second.type.localeCompare(first.type)
    }

    if (sortOption === "method_az") {
      return first.methodLabel.localeCompare(second.methodLabel)
    }

    if (sortOption === "method_za") {
      return second.methodLabel.localeCompare(first.methodLabel)
    }

    if (sortOption === "amount_high") {
      return second.amount - first.amount
    }

    return first.amount - second.amount
  })
}

export function OwnerRevenueTable({ rows }: OwnerRevenueTableProps) {
  const [sortOption, setSortOption] = useState<RevenueSortOption>("paid_latest")
  const updateSortOption = (value: string) => {
    if (isRevenueSortOption(value)) {
      setSortOption(value)
    }
  }
  const sortedRows = useMemo(
    () => sortRevenueRows(rows, sortOption),
    [rows, sortOption]
  )

  if (!rows.length) {
    return (
      <Empty className="min-h-64 rounded-none border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptText />
          </EmptyMedia>
          <EmptyTitle>No paid membership subscriptions yet</EmptyTitle>
          <EmptyDescription>
            Paid subscription payments will appear here once members complete
            checkout.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="px-4">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["paid_latest", "paid_oldest"],
                "paid"
              )}
              label={getSortLabel(sortOption, paidSortOptions, "Paid at")}
              options={[
                { value: "paid", label: "Paid at", disabled: true },
                ...paidSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort paid dates"
              className="w-44"
            />
          </TableHead>
          <TableHead>
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
              ariaLabel="Sort members"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["package_az", "package_za"],
                "package"
              )}
              label={getSortLabel(sortOption, packageSortOptions, "Package")}
              options={[
                { value: "package", label: "Package", disabled: true },
                ...packageSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort packages"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["source_az", "source_za"],
                "source"
              )}
              label={getSortLabel(sortOption, sourceSortOptions, "Source")}
              options={[
                { value: "source", label: "Source", disabled: true },
                ...sourceSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort sources"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["method_az", "method_za"],
                "method"
              )}
              label={getSortLabel(sortOption, methodSortOptions, "Method")}
              options={[
                { value: "method", label: "Method", disabled: true },
                ...methodSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort payment methods"
              className="w-36"
            />
          </TableHead>
          <TableHead className="pr-4 text-right">
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["amount_high", "amount_low"],
                "amount"
              )}
              label={getSortLabel(sortOption, amountSortOptions, "Amount")}
              options={[
                { value: "amount", label: "Amount", disabled: true },
                ...amountSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort amounts"
              className="ml-auto w-40 justify-end pr-0"
            />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="px-4 font-mono text-xs text-muted-foreground">
              {row.paidAtLabel}
            </TableCell>
            <TableCell>
              <div className="min-w-40">
                <p className="truncate font-medium">{row.memberName}</p>
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
  )
}
