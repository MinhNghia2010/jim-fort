"use client"

import { useState } from "react"
import Link from "next/link"
import { BadgePercent, CirclePlus, MoreHorizontal, Tag } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type {
  VoucherView,
  VoucherViewStatus,
} from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import {
  TablePagination,
  TABLE_ROWS_PER_PAGE,
} from "@/components/TablePagination"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface OwnerVouchersTableProps {
  vouchers: readonly VoucherView[]
  canManage: boolean
}

const codeSortOptions = [
  { value: "code_asc", label: "A-Z" },
  { value: "code_desc", label: "Z-A" },
] as const

const discountSortOptions = [
  { value: "discount_asc", label: "A-Z" },
  { value: "discount_desc", label: "Z-A" },
] as const

const usageSortOptions = [
  { value: "usage_desc", label: "High-Low" },
  { value: "usage_asc", label: "Low-High" },
] as const

const startsSortOptions = [
  { value: "starts_desc", label: "Latest" },
  { value: "starts_asc", label: "Oldest" },
] as const

const expiresSortOptions = [
  { value: "expires_desc", label: "Latest" },
  { value: "expires_asc", label: "Oldest" },
] as const

const statusFilterOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "redeemed", label: "Redeemed" },
  { value: "disabled", label: "Disabled" },
  { value: "expired", label: "Expired" },
] as const

type VoucherSort =
  | (typeof codeSortOptions)[number]["value"]
  | (typeof discountSortOptions)[number]["value"]
  | (typeof usageSortOptions)[number]["value"]
  | (typeof startsSortOptions)[number]["value"]
  | (typeof expiresSortOptions)[number]["value"]

type VoucherStatusFilter = (typeof statusFilterOptions)[number]["value"]

function voucherStatusVariant(status: VoucherViewStatus) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "expired") {
    return "destructive" as const
  }

  if (status === "disabled" || status === "scheduled") {
    return "outline" as const
  }

  return "secondary" as const
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function getDateValue(value: string | null, nullValue: number) {
  return value ? new Date(value).getTime() : nullValue
}

function sortVouchers(vouchers: VoucherView[], sort: VoucherSort) {
  return [...vouchers].sort((first, second) => {
    if (sort === "code_asc") {
      return compareText(first.code, second.code)
    }

    if (sort === "code_desc") {
      return compareText(second.code, first.code)
    }

    if (sort === "discount_asc") {
      return compareText(first.discountLabel, second.discountLabel)
    }

    if (sort === "discount_desc") {
      return compareText(second.discountLabel, first.discountLabel)
    }

    if (sort === "usage_asc") {
      return first.usage - second.usage
    }

    if (sort === "starts_desc") {
      return getDateValue(second.startsAt, 0) - getDateValue(first.startsAt, 0)
    }

    if (sort === "starts_asc") {
      return (
        getDateValue(first.startsAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.startsAt, Number.MAX_SAFE_INTEGER)
      )
    }

    if (sort === "expires_desc") {
      return (
        getDateValue(second.expiresAt, 0) - getDateValue(first.expiresAt, 0)
      )
    }

    if (sort === "expires_asc") {
      return (
        getDateValue(first.expiresAt, Number.MAX_SAFE_INTEGER) -
        getDateValue(second.expiresAt, Number.MAX_SAFE_INTEGER)
      )
    }

    return second.usage - first.usage
  })
}

export function OwnerVouchersTable({
  vouchers,
  canManage,
}: OwnerVouchersTableProps) {
  const [sort, setSort] = useState<VoucherSort>("code_asc")
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const filteredVouchers = vouchers.filter(
    (voucher) => statusFilter === "all" || voucher.status === statusFilter
  )
  const sortedVouchers = sortVouchers(filteredVouchers, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedVouchers.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedVouchers = sortedVouchers.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedVouchers.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedVouchers.length
  )
  const codeSortValue =
    sort === "code_desc" || sort === "code_asc" ? sort : "code_asc"
  const discountSortValue =
    sort === "discount_desc" || sort === "discount_asc" ? sort : "discount_asc"
  const usageSortValue =
    sort === "usage_asc" || sort === "usage_desc" ? sort : "usage_desc"
  const startsSortValue =
    sort === "starts_asc" || sort === "starts_desc" ? sort : "starts_desc"
  const expiresSortValue =
    sort === "expires_asc" || sort === "expires_desc" ? sort : "expires_desc"

  function handleSortChange(value: VoucherSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: VoucherStatusFilter) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Voucher codes</CardTitle>
        <CardDescription>
          Showing {paginatedVouchers.length} of {sortedVouchers.length} voucher
          records.
        </CardDescription>
        {canManage ? (
          <CardAction>
            <Button asChild size="sm">
              <Link href="/vouchers/create">
                <CirclePlus data-icon="inline-start" />
                Create voucher
              </Link>
            </Button>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="px-0">
        <Table className="table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="h-12 pl-6">
                <OwnerTableHeaderSelect
                  label="Code"
                  value={codeSortValue}
                  options={codeSortOptions}
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
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Usage"
                  value={usageSortValue}
                  options={usageSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Starts"
                  value={startsSortValue}
                  options={startsSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Expires"
                  value={expiresSortValue}
                  options={expiresSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Status"
                  value={statusFilter}
                  options={statusFilterOptions}
                  onValueChange={handleStatusFilterChange}
                />
              </TableHead>
              <TableHead className="h-12 pr-6 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedVouchers.length ? (
              paginatedVouchers.map((voucher) => (
                <TableRow key={voucher.code} className="h-[4.5rem]">
                  <TableCell className="pl-6">
                    <div className="flex items-center gap-2">
                      <BadgePercent
                        aria-hidden="true"
                        className="size-4 text-primary"
                      />
                      <span className="font-mono font-medium">
                        {voucher.code}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {voucher.discountLabel}
                  </TableCell>
                  <TableCell>
                    <div className="grid grid-cols-[3.75rem_4.5rem] items-center gap-2">
                      <span className="font-mono text-xs tabular-nums">
                        {voucher.usage} / {voucher.quantity}
                      </span>
                      <Progress
                        aria-label={`${voucher.code} usage`}
                        value={Math.min(
                          100,
                          (voucher.usage / voucher.quantity) * 100
                        )}
                        className="w-18"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs break-words text-muted-foreground">
                    {voucher.startsAtLabel}
                  </TableCell>
                  <TableCell className="font-mono text-xs break-words text-muted-foreground">
                    {voucher.expiresAtLabel}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={voucherStatusVariant(voucher.status)}
                      className="capitalize"
                    >
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Open actions for ${voucher.code}`}
                        >
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/voucher/${encodeURIComponent(voucher.code)}`}
                            >
                              View details
                            </Link>
                          </DropdownMenuItem>
                          {canManage ? (
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/vouchers/edit?voucher=${encodeURIComponent(voucher.code)}`}
                              >
                                Edit voucher
                              </Link>
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Tag />
                      </EmptyMedia>
                      <EmptyTitle>No vouchers found</EmptyTitle>
                      <EmptyDescription>
                        Create a code or choose a different status filter.
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
            Showing {visibleStart}-{visibleEnd} of {sortedVouchers.length}{" "}
            voucher records
          </span>
          <TablePagination
            activePage={activePage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </CardContent>
    </Card>
  )
}
