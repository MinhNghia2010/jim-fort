"use client"

import { useState } from "react"
import Link from "next/link"
import { Check, CirclePlus, PackageCheck, Pencil } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import type { MembershipPlanView } from "@/components/screens/owner/memberships/OwnerMembershipsPage"
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

interface OwnerMembershipsTableProps {
  plans: readonly MembershipPlanView[]
  canManage: boolean
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

function statusVariant(status: MembershipPlanView["status"]) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "archived") {
    return "outline" as const
  }

  return "secondary" as const
}

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
}: OwnerMembershipsTableProps) {
  const [sort, setSort] = useState<MembershipSort>("plan_asc")
  const [statusFilter, setStatusFilter] =
    useState<MembershipStatusFilter>("all")
  const filteredPlans = plans.filter(
    (plan) => statusFilter === "all" || plan.status === statusFilter
  )
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
            <Button asChild size="sm">
              <Link href="/memberships/create">
                <CirclePlus data-icon="inline-start" />
                Create membership
              </Link>
            </Button>
          ) : null}
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table className="min-w-[1180px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <colgroup>
              <col className="w-[18rem]" />
              <col className="w-[9rem]" />
              <col className="w-[10rem]" />
              <col className="w-[9rem]" />
              <col className="w-[27rem]" />
              <col className="w-[9rem]" />
              <col className="w-[12rem]" />
              {canManage ? <col className="w-[7rem]" /> : null}
            </colgroup>
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
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Active members"
                    value={membersSortValue}
                    options={membersSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Revenue"
                    value={revenueSortValue}
                    options={revenueSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                {canManage ? (
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPlans.length ? (
                sortedPlans.map((plan) => (
                  <TableRow key={plan.id} className="h-[4.5rem]">
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
                    <TableCell className="font-heading text-lg font-semibold tabular-nums">
                      {plan.priceLabel}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.termLabel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(plan.status)}
                        className="capitalize"
                      >
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {plan.features.length ? (
                        <div className="flex flex-col gap-1.5">
                          {plan.features.map((feature) => (
                            <div
                              key={feature}
                              className="flex items-start gap-2"
                            >
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
                    <TableCell className="font-mono font-medium tabular-nums">
                      {plan.activeMembers.toLocaleString("en-US")}
                    </TableCell>
                    <TableCell className="font-mono font-medium tabular-nums">
                      {plan.revenueLabel}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="pr-6 text-right">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/memberships/edit?planId=${plan.id}`}>
                            <Pencil data-icon="inline-start" />
                            Edit
                          </Link>
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 8 : 7} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <PackageCheck />
                        </EmptyMedia>
                        <EmptyTitle>No membership plans found</EmptyTitle>
                        <EmptyDescription>
                          {plans.length
                            ? "Try a different status filter."
                            : "Plans from the live membership_packages table will appear here."}
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
