"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Archive, Check, CirclePlus, PackageCheck, Pencil, Search } from "lucide-react"

import {
  archiveMembershipPackage,
  deleteMembershipPackage,
} from "@/app/(main)/memberships/actions"
import { StatusBadge } from "@/components/StatusBadge"
import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type {
  FacilityFilterOption,
  MembershipPlanView,
} from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import { TableActionButton } from "@/components/TableActionButton"
import { TableRowActions } from "@/components/TableRowActions"
import {
  ALL_MONTHS_VALUE,
  TableMonthFilter,
  type TableMonthFilterOption,
} from "@/components/TableMonthFilter"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useOptimisticDeletion } from "@/lib/hooks/useOptimisticDeletion"
import { cn } from "@/lib/utils"

interface OwnerMembershipsTableProps {
  plans: readonly MembershipPlanView[]
  canManage: boolean
  monthFilter?: string
  monthFilterOptions?: readonly TableMonthFilterOption[]
  onMonthFilterChange?: (value: string) => void
  facilityFilter?: string
  facilityFilterOptions?: readonly FacilityFilterOption[]
  onFacilityFilterChange?: (value: string) => void
  showFacilityColumn?: boolean
}

const planSortOptions = [
  { value: "plan_asc", label: "A-Z" },
  { value: "plan_desc", label: "Z-A" },
] as const

const priceSortOptions = [
  { value: "price_desc", label: "High-Low" },
  { value: "price_asc", label: "Low-High" },
] as const

const termSortOptions = [
  { value: "term_asc", label: "Short-Long" },
  { value: "term_desc", label: "Long-Short" },
] as const

const membersSortOptions = [
  { value: "members_desc", label: "High-Low" },
  { value: "members_asc", label: "Low-High" },
] as const

const revenueSortOptions = [
  { value: "revenue_desc", label: "High-Low" },
  { value: "revenue_asc", label: "Low-High" },
] as const

const statusFilterOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "archived", label: "Archived" },
] as const

type MembershipSort =
  | (typeof planSortOptions)[number]["value"]
  | (typeof priceSortOptions)[number]["value"]
  | (typeof termSortOptions)[number]["value"]
  | (typeof membersSortOptions)[number]["value"]
  | (typeof revenueSortOptions)[number]["value"]

type MembershipStatusFilter = (typeof statusFilterOptions)[number]["value"]

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function getNumberValue(value: string) {
  const number = Number(value.replace(/[^0-9.-]/g, ""))

  return Number.isFinite(number) ? number : 0
}

function getTermValue(value: string) {
  const normalizedValue = value.toLowerCase()
  const amount = Number(normalizedValue.match(/\d+(\.\d+)?/)?.[0] ?? 0)

  if (!Number.isFinite(amount)) {
    return 0
  }

  if (normalizedValue.includes("year")) {
    return amount * 365
  }

  if (normalizedValue.includes("month")) {
    return amount * 30
  }

  return amount
}

function sortPlans(plans: MembershipPlanView[], sort: MembershipSort) {
  return [...plans].sort((first, second) => {
    if (sort === "plan_desc") {
      return compareText(second.name, first.name)
    }

    if (sort === "price_desc") {
      return (
        getNumberValue(second.priceLabel) - getNumberValue(first.priceLabel)
      )
    }

    if (sort === "price_asc") {
      return (
        getNumberValue(first.priceLabel) - getNumberValue(second.priceLabel)
      )
    }

    if (sort === "term_desc") {
      return getTermValue(second.termLabel) - getTermValue(first.termLabel)
    }

    if (sort === "term_asc") {
      return getTermValue(first.termLabel) - getTermValue(second.termLabel)
    }

    if (sort === "members_desc") {
      return second.activeMembers - first.activeMembers
    }

    if (sort === "members_asc") {
      return first.activeMembers - second.activeMembers
    }

    if (sort === "revenue_desc") {
      return (
        getNumberValue(second.revenueLabel) - getNumberValue(first.revenueLabel)
      )
    }

    if (sort === "revenue_asc") {
      return (
        getNumberValue(first.revenueLabel) - getNumberValue(second.revenueLabel)
      )
    }

    return compareText(first.name, second.name)
  })
}

export function OwnerMembershipsTable({
  plans,
  canManage,
  monthFilter = ALL_MONTHS_VALUE,
  monthFilterOptions = [{ value: ALL_MONTHS_VALUE, label: "All months" }],
  onMonthFilterChange,
  facilityFilter = "all",
  facilityFilterOptions = [{ value: "all", label: "All facilities" }],
  onFacilityFilterChange,
  showFacilityColumn = false,
}: OwnerMembershipsTableProps) {
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<MembershipSort>("plan_asc")
  const [statusFilter, setStatusFilter] =
    useState<MembershipStatusFilter>("all")
  const [isPending, startTransition] = useTransition()
  const {
    commitDeletion: commitPlanDeletion,
    deleteOptimistically: markPlanDeleted,
    optimisticDeletedIds: optimisticDeletedPlanIds,
  } = useOptimisticDeletion()
  const normalizedSearch = search.trim().toLowerCase()
  const filteredPlans = plans.filter((plan) => {
    const searchableText = [
      plan.name,
      plan.description,
      plan.facilityName,
      plan.status,
      plan.priceLabel,
      plan.termLabel,
      ...plan.features,
      plan.activeMembers,
      plan.revenueLabel,
    ]
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (statusFilter === "all" || plan.status === statusFilter)
    )
  })
  const sortedPlans = sortPlans(filteredPlans, sort)
  const planSortValue =
    sort === "plan_desc" || sort === "plan_asc" ? sort : "plan_asc"
  const priceSortValue =
    sort === "price_desc" || sort === "price_asc" ? sort : "price_desc"
  const termSortValue =
    sort === "term_desc" || sort === "term_asc" ? sort : "term_asc"
  const membersSortValue =
    sort === "members_desc" || sort === "members_asc" ? sort : "members_desc"
  const revenueSortValue =
    sort === "revenue_desc" || sort === "revenue_asc" ? sort : "revenue_desc"
  const membersHeaderLabel = canManage ? "Active members" : "Members"
  const totalColSpan =
    (canManage ? 8 : 7) + (showFacilityColumn ? 1 : 0)

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Membership plans</CardTitle>
        <CardDescription>
          Showing {sortedPlans.length} of {plans.length} membership plans.
        </CardDescription>
        <CardAction className="flex items-center gap-2">
          <Badge variant="secondary">{plans.length} plans</Badge>
          {canManage ? (
            <TableActionButton asChild tone="create">
              <Link href="/memberships/create">
                <CirclePlus data-icon="inline-start" />
                Create membership
              </Link>
            </TableActionButton>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <InputGroup className="w-full lg:w-96">
            <InputGroupInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search membership plans..."
              aria-label="Search membership plans"
            />
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
          {onMonthFilterChange || onFacilityFilterChange ? (
            <div className="flex items-center gap-2">
              {showFacilityColumn && onFacilityFilterChange ? (
                <Select
                  value={facilityFilter}
                  onValueChange={onFacilityFilterChange}
                >
                  <SelectTrigger
                    aria-label="Filter by facility"
                    className="h-9 w-full sm:w-48"
                  >
                    <SelectValue placeholder="All facilities" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    <SelectGroup>
                      {facilityFilterOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              ) : null}
              {onMonthFilterChange ? (
                <TableMonthFilter
                  value={monthFilter}
                  options={monthFilterOptions}
                  onValueChange={onMonthFilterChange}
                  label="Filter membership stats by month"
                />
              ) : null}
            </div>
          ) : null}
        </div>
        <Table
          className={cn(
            "table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal",
            canManage || showFacilityColumn ? "min-w-[1080px]" : "w-full"
          )}
        >
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="h-12 pl-6">
                <OwnerTableHeaderSelect
                  label="Plan"
                  value={planSortValue}
                  options={planSortOptions}
                  onValueChange={setSort}
                />
              </TableHead>
              {showFacilityColumn ? (
                <TableHead className="h-12">Facility</TableHead>
              ) : null}
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Price"
                  value={priceSortValue}
                  options={priceSortOptions}
                  onValueChange={setSort}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Term"
                  value={termSortValue}
                  options={termSortOptions}
                  onValueChange={setSort}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Status"
                  value={statusFilter}
                  options={statusFilterOptions}
                  onValueChange={setStatusFilter}
                />
              </TableHead>
              <TableHead className="h-12">Features</TableHead>
              <TableHead className="h-12 px-4">
                <OwnerTableHeaderSelect
                  label={membersHeaderLabel}
                  value={membersSortValue}
                  options={membersSortOptions}
                  onValueChange={setSort}
                />
              </TableHead>
              <TableHead className="h-12 px-4">
                <OwnerTableHeaderSelect
                  label="Revenue"
                  value={revenueSortValue}
                  options={revenueSortOptions}
                  onValueChange={setSort}
                />
              </TableHead>
              {canManage ? (
                <TableHead className="h-12 w-[10%] text-center">
                  <span className="sr-only">Actions</span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedPlans.length ? (
              sortedPlans.map((plan) => (
                <TableRow
                  key={plan.id}
                  aria-hidden={optimisticDeletedPlanIds.includes(plan.id)}
                  className={cn(
                    "h-[4.5rem]",
                    optimisticDeletedPlanIds.includes(plan.id) && "hidden"
                  )}
                >
                  <TableCell className="pl-6">
                    <div className="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        className="mt-1 size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: plan.color }}
                      />
                      <div className="min-w-0">
                        <p className="leading-5 font-semibold break-words">
                          {plan.name}
                        </p>
                        <p className="text-sm break-words text-muted-foreground">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  {showFacilityColumn ? (
                    <TableCell className="text-sm text-muted-foreground">
                      {plan.facilityName}
                    </TableCell>
                  ) : null}
                  <TableCell className="font-heading text-lg font-semibold whitespace-nowrap tabular-nums">
                    {plan.priceLabel}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {plan.termLabel}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={plan.status} showDot />
                  </TableCell>
                  <TableCell>
                    {plan.features.length ? (
                      <div className="flex flex-col gap-1.5">
                        {plan.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-2">
                            <Check
                              aria-hidden="true"
                              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span className="text-sm break-words text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        No listed features
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 font-mono font-medium whitespace-nowrap tabular-nums">
                    {plan.activeMembers.toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="px-4 font-mono font-medium whitespace-nowrap tabular-nums">
                    {plan.revenueLabel}
                  </TableCell>
                  {canManage ? (
                    <TableCell className="w-[10%] text-center">
                      <TableRowActions
                        label={`Open actions for ${plan.name}`}
                        deleteAction={{
                          action: deleteMembershipPackage,
                          description: `Delete ${plan.name}? This permanently removes the plan and its room access. Plans with subscription history must be archived instead.`,
                          inputName: "packageId",
                          inputValue: plan.id,
                          onDeleteSuccess: () => commitPlanDeletion(plan.id),
                          onOptimisticDelete: () => markPlanDeleted(plan.id),
                          successMessage: "Membership plan deleted",
                          title: "Delete membership plan?",
                        }}
                      >
                        <DropdownMenuItem asChild>
                          <Link href={`/memberships/edit?planId=${plan.id}`}>
                            <Pencil data-icon="inline-start" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        {plan.status !== "archived" ? (
                          <DropdownMenuItem
                            disabled={isPending}
                            onSelect={(e) => {
                              e.preventDefault()
                              startTransition(async () => {
                                const formData = new FormData()
                                formData.append("packageId", plan.id)
                                await archiveMembershipPackage(formData)
                              })
                            }}
                          >
                            <Archive data-icon="inline-start" />
                            Archive
                          </DropdownMenuItem>
                        ) : null}
                      </TableRowActions>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={totalColSpan} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <PackageCheck />
                      </EmptyMedia>
                      <EmptyTitle>No membership plans found</EmptyTitle>
                      <EmptyDescription>
                        {plans.length
                          ? "Try a different search term or status filter."
                          : "Plans from the live membership_packages table will appear here."}
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
