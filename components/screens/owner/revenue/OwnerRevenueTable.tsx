"use client"

import { useState } from "react"
import { ReceiptText, Search } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import { TableRowActions } from "@/components/TableRowActions"
import type { RevenueHistoryRow } from "@/components/screens/owner/revenue/OwnerRevenuePage"
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
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
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
  monthFilter?: string
  onMonthFilterChange?: (value: string) => void
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

export function OwnerRevenueTable({
  rows,
  monthFilter: controlledMonthFilter,
  onMonthFilterChange,
}: OwnerRevenueTableProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<RevenueSort>("paid_desc")
  const [internalMonthFilter, setInternalMonthFilter] =
    useState(ALL_MONTHS_VALUE)
  const [currentPage, setCurrentPage] = useState(1)
  const monthFilter = controlledMonthFilter ?? internalMonthFilter
  const normalizedSearch = search.trim().toLowerCase()
  const monthFilterOptions = getTableMonthFilterOptions(
    rows,
    (row) => row.paidAt
  )
  const filteredRows = rows.filter((row) => {
    const searchableText = [
      row.paidAtLabel,
      row.memberName,
      row.memberPhone,
      row.packageName,
      row.type,
      row.methodLabel,
      row.amountLabel,
      row.subscriptionStatus,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      matchesTableMonthFilter(row.paidAt, monthFilter)
    )
  })
  const sortedRows = sortRevenueRows([...filteredRows], sort)
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

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleSortChange(value: RevenueSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleMonthFilterChange(value: string) {
    if (onMonthFilterChange) {
      onMonthFilterChange(value)
    } else {
      setInternalMonthFilter(value)
    }

    setCurrentPage(1)
  }

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <InputGroup className="w-full lg:w-96">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search revenue..."
            aria-label="Search revenue"
          />
        </InputGroup>
        <TableMonthFilter
          value={monthFilter}
          options={monthFilterOptions}
          onValueChange={handleMonthFilterChange}
          label="Filter revenue by paid month"
        />
      </div>
      <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
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
            <TableHead className="h-12">
              <OwnerTableHeaderSelect
                label="Amount"
                value={amountSortValue}
                options={amountSortOptions}
                onValueChange={handleSortChange}
              />
            </TableHead>
            <TableHead className="h-12 pr-6 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedRows.length ? (
            paginatedRows.map((row) => (
              <TableRow key={row.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-mono text-xs whitespace-nowrap text-muted-foreground">
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
                <TableCell className="break-words">{row.packageName}</TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="h-auto min-h-5 max-w-full text-center leading-tight whitespace-normal"
                  >
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {row.methodLabel}
                </TableCell>
                <TableCell className="font-mono font-medium whitespace-nowrap tabular-nums">
                  {row.amountLabel}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <TableRowActions
                    label={`Open actions for ${row.packageName}`}
                    actions={[
                      {
                        href: `/payments/${row.id}`,
                        label: "View detail",
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-64">
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
                      complete checkout or when the filters match a payment.
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
