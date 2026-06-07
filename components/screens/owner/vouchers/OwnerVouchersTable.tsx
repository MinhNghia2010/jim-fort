"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { BadgePercent, MoreHorizontal, Tag } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type {
  VoucherView,
  VoucherViewStatus,
} from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  canManage?: boolean
}

type VoucherSortOption =
  | "code_az"
  | "code_za"
  | "discount_az"
  | "discount_za"
  | "usage_high"
  | "usage_low"
  | "starts_latest"
  | "starts_oldest"
  | "expires_latest"
  | "expires_oldest"

type VoucherStatusFilter = "all" | VoucherViewStatus

const codeSortOptions = [
  { value: "code_az", label: "Code: A-Z" },
  { value: "code_za", label: "Code: Z-A" },
] as const

const discountSortOptions = [
  { value: "discount_az", label: "Discount: A-Z" },
  { value: "discount_za", label: "Discount: Z-A" },
] as const

const usageSortOptions = [
  { value: "usage_high", label: "Usage: High-Low" },
  { value: "usage_low", label: "Usage: Low-High" },
] as const

const startsSortOptions = [
  { value: "starts_latest", label: "Starts: Latest" },
  { value: "starts_oldest", label: "Starts: Oldest" },
] as const

const expiresSortOptions = [
  { value: "expires_latest", label: "Expires: Latest" },
  { value: "expires_oldest", label: "Expires: Oldest" },
] as const

const statusFilterOptions = [
  { value: "all", label: "Status: All" },
  { value: "active", label: "Status: Active" },
  { value: "scheduled", label: "Status: Scheduled" },
  { value: "redeemed", label: "Status: Redeemed" },
  { value: "disabled", label: "Status: Disabled" },
  { value: "expired", label: "Status: Expired" },
] as const

const voucherSortValues: readonly VoucherSortOption[] = [
  "code_az",
  "code_za",
  "discount_az",
  "discount_za",
  "usage_high",
  "usage_low",
  "starts_latest",
  "starts_oldest",
  "expires_latest",
  "expires_oldest",
]

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

function isVoucherSortOption(value: string): value is VoucherSortOption {
  return voucherSortValues.includes(value as VoucherSortOption)
}

function getHeaderSortValue(
  sortOption: VoucherSortOption,
  values: readonly VoucherSortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: VoucherSortOption,
  options: readonly { value: VoucherSortOption; label: string }[],
  fallback: string
) {
  return (
    options.find((option) => option.value === sortOption)?.label ?? fallback
  )
}

function getStatusFilterLabel(statusFilter: VoucherStatusFilter) {
  return (
    statusFilterOptions.find((option) => option.value === statusFilter)
      ?.label ?? "Status"
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

function sortVouchers(
  vouchers: readonly VoucherView[],
  sortOption: VoucherSortOption
) {
  return [...vouchers].sort((first, second) => {
    if (sortOption === "code_az") {
      return first.code.localeCompare(second.code)
    }

    if (sortOption === "code_za") {
      return second.code.localeCompare(first.code)
    }

    if (sortOption === "discount_az") {
      return first.discountLabel.localeCompare(second.discountLabel)
    }

    if (sortOption === "discount_za") {
      return second.discountLabel.localeCompare(first.discountLabel)
    }

    if (sortOption === "usage_high") {
      return second.usage / second.quantity - first.usage / first.quantity
    }

    if (sortOption === "usage_low") {
      return first.usage / first.quantity - second.usage / second.quantity
    }

    if (sortOption === "starts_latest") {
      return compareNullableTime(first.startsAt, second.startsAt, "descending")
    }

    if (sortOption === "starts_oldest") {
      return compareNullableTime(first.startsAt, second.startsAt, "ascending")
    }

    if (sortOption === "expires_latest") {
      return compareNullableTime(
        first.expiresAt,
        second.expiresAt,
        "descending"
      )
    }

    return compareNullableTime(first.expiresAt, second.expiresAt, "ascending")
  })
}

export function OwnerVouchersTable({
  vouchers,
  canManage = true,
}: OwnerVouchersTableProps) {
  const [sortOption, setSortOption] = useState<VoucherSortOption>("code_az")
  const [statusFilter, setStatusFilter] = useState<VoucherStatusFilter>("all")
  const updateSortOption = (value: string) => {
    if (isVoucherSortOption(value)) {
      setSortOption(value)
    }
  }
  const filteredVouchers = useMemo(() => {
    const matchingVouchers = vouchers.filter(
      (voucher) => statusFilter === "all" || voucher.status === statusFilter
    )

    return sortVouchers(matchingVouchers, sortOption)
  }, [vouchers, statusFilter, sortOption])

  if (!vouchers.length) {
    return (
      <Empty className="min-h-64 rounded-none border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Tag />
          </EmptyMedia>
          <EmptyTitle>No vouchers yet</EmptyTitle>
          <EmptyDescription>
            The live vouchers table is empty. Create a code with launch and end
            dates to start tracking redemptions.
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
                ["code_az", "code_za"],
                "code"
              )}
              label={getSortLabel(sortOption, codeSortOptions, "Code")}
              options={[
                { value: "code", label: "Code", disabled: true },
                ...codeSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort voucher codes"
              className="w-36"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["discount_az", "discount_za"],
                "discount"
              )}
              label={getSortLabel(sortOption, discountSortOptions, "Discount")}
              options={[
                { value: "discount", label: "Discount", disabled: true },
                ...discountSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort discounts"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["usage_high", "usage_low"],
                "usage"
              )}
              label={getSortLabel(sortOption, usageSortOptions, "Usage")}
              options={[
                { value: "usage", label: "Usage", disabled: true },
                ...usageSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort voucher usage"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["starts_latest", "starts_oldest"],
                "starts"
              )}
              label={getSortLabel(sortOption, startsSortOptions, "Starts")}
              options={[
                { value: "starts", label: "Starts", disabled: true },
                ...startsSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort voucher start dates"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={getHeaderSortValue(
                sortOption,
                ["expires_latest", "expires_oldest"],
                "expires"
              )}
              label={getSortLabel(sortOption, expiresSortOptions, "Expires")}
              options={[
                { value: "expires", label: "Expires", disabled: true },
                ...expiresSortOptions,
              ]}
              onValueChange={updateSortOption}
              ariaLabel="Sort voucher expiry dates"
              className="w-40"
            />
          </TableHead>
          <TableHead>
            <OwnerTableHeaderSelect
              value={statusFilter}
              label={getStatusFilterLabel(statusFilter)}
              options={statusFilterOptions}
              onValueChange={(value) =>
                setStatusFilter(value as VoucherStatusFilter)
              }
              ariaLabel="Filter vouchers by status"
              className="w-40"
            />
          </TableHead>
          <TableHead className="pr-4 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredVouchers.length ? (
          filteredVouchers.map((voucher) => (
            <TableRow key={voucher.code}>
              <TableCell className="px-4">
                <div className="flex items-center gap-2">
                  <BadgePercent
                    aria-hidden="true"
                    className="size-4 text-primary"
                  />
                  <span className="font-mono font-medium">{voucher.code}</span>
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {voucher.discountLabel}
              </TableCell>
              <TableCell>
                <div className="flex min-w-28 items-center gap-2">
                  <span className="font-mono text-xs tabular-nums">
                    {voucher.usage} / {voucher.quantity}
                  </span>
                  <Progress
                    aria-label={`${voucher.code} usage`}
                    value={Math.min(
                      100,
                      (voucher.usage / voucher.quantity) * 100
                    )}
                    className="max-w-16"
                  />
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {voucher.startsAtLabel}
              </TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
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
              <TableCell className="pr-4 text-right">
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
                          href={`/voucher/view=${encodeURIComponent(voucher.code)}`}
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
                    Try a different status filter.
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
