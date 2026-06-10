"use client"

import { useActionState, useEffect, useId, useRef, useState } from "react"
import Link from "next/link"
import { ClipboardList, Loader2, Search, X } from "lucide-react"
import { toast } from "sonner"

import { cancelPendingSubscription } from "@/app/(main)/member-actions"
import { StatusBadge } from "@/components/StatusBadge"
import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import { TableRowActions } from "@/components/TableRowActions"
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
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

export type MemberSubscriptionStatus =
  | "pending_pt_setup"
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled"
  | "unknown"

export interface MemberSubscriptionTableRow {
  id: string
  plan: string
  facility: string
  status: MemberSubscriptionStatus
  type: "pt" | "access"
  createdAt: string
  amount: number
}

interface MemberSubscriptionsTableProps {
  subscriptions: MemberSubscriptionTableRow[]
}

type MemberActionState = {
  error?: string
  message?: string
}

const statusFilters = [
  { value: "all", label: "Status: All" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const

type StatusFilter = (typeof statusFilters)[number]["value"]

const planSortOptions = [
  { value: "plan_asc", label: "A-Z" },
  { value: "plan_desc", label: "Z-A" },
] as const

const facilitySortOptions = [
  { value: "facility_asc", label: "A-Z" },
  { value: "facility_desc", label: "Z-A" },
] as const

const typeSortOptions = [
  { value: "type_access", label: "Access first" },
  { value: "type_pt", label: "PT first" },
] as const

const createdSortOptions = [
  { value: "created_desc", label: "Latest" },
  { value: "created_asc", label: "Oldest" },
] as const

const amountSortOptions = [
  { value: "amount_desc", label: "High-Low" },
  { value: "amount_asc", label: "Low-High" },
] as const

type SubscriptionSort =
  | (typeof planSortOptions)[number]["value"]
  | (typeof facilitySortOptions)[number]["value"]
  | (typeof typeSortOptions)[number]["value"]
  | (typeof createdSortOptions)[number]["value"]
  | (typeof amountSortOptions)[number]["value"]

const statusLabels: Record<MemberSubscriptionStatus, string> = {
  pending_pt_setup: "Pending PT setup",
  pending_payment: "Pending payment",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
  unknown: "Unknown",
}

const typeLabels: Record<MemberSubscriptionTableRow["type"], string> = {
  pt: "PT package",
  access: "Access package",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "Asia/Ho_Chi_Minh",
})
const appTimeZone = "Asia/Ho_Chi_Minh"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function compareDate(first: string, second: string) {
  return new Date(first).getTime() - new Date(second).getTime()
}

function matchesStatus(status: MemberSubscriptionStatus, filter: StatusFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "pending") {
    return status === "pending_payment" || status === "pending_pt_setup"
  }

  return status === filter
}

function sortSubscriptions(
  subscriptions: MemberSubscriptionTableRow[],
  sort: SubscriptionSort
) {
  return [...subscriptions].sort((first, second) => {
    if (sort === "plan_asc") {
      return compareText(first.plan, second.plan)
    }

    if (sort === "plan_desc") {
      return compareText(second.plan, first.plan)
    }

    if (sort === "facility_asc") {
      return compareText(first.facility, second.facility)
    }

    if (sort === "facility_desc") {
      return compareText(second.facility, first.facility)
    }

    if (sort === "type_access") {
      return compareText(typeLabels[first.type], typeLabels[second.type])
    }

    if (sort === "type_pt") {
      return compareText(typeLabels[second.type], typeLabels[first.type])
    }

    if (sort === "created_asc") {
      return compareDate(first.createdAt, second.createdAt)
    }

    if (sort === "amount_desc") {
      return second.amount - first.amount
    }

    if (sort === "amount_asc") {
      return first.amount - second.amount
    }

    return compareDate(second.createdAt, first.createdAt)
  })
}

function canCancelSubscription(status: MemberSubscriptionStatus) {
  return status === "pending_payment" || status === "pending_pt_setup"
}

const initialActionState: MemberActionState = {}

function CancelSubscriptionMenuAction({
  subscriptionId,
}: {
  subscriptionId: string
}) {
  const formId = useId()
  const [state, formAction, pending] = useActionState(
    cancelPendingSubscription,
    initialActionState
  )
  const wasPending = useRef(false)

  useEffect(() => {
    if (pending) {
      wasPending.current = true
      return
    }

    if (!wasPending.current) {
      return
    }

    wasPending.current = false

    if (state.error) {
      toast.error(state.error)
      return
    }

    toast.success(state.message ?? "Subscription cancelled")
  }, [pending, state.error, state.message])

  return (
    <>
      <form id={formId} action={formAction} className="hidden">
        <input type="hidden" name="subscriptionId" value={subscriptionId} />
      </form>
      <DropdownMenuItem asChild variant="destructive" disabled={pending}>
        <button type="submit" form={formId}>
          {pending ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <X aria-hidden="true" />
          )}
          {pending ? "Cancelling" : "Cancel"}
        </button>
      </DropdownMenuItem>
    </>
  )
}

export function MemberSubscriptionsTable({
  subscriptions,
}: MemberSubscriptionsTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const [sort, setSort] = useState<SubscriptionSort>("created_desc")
  const [currentPage, setCurrentPage] = useState(1)

  const normalizedSearch = search.trim().toLowerCase()
  const monthFilterOptions = getTableMonthFilterOptions(
    subscriptions,
    (subscription) => subscription.createdAt,
    appTimeZone
  )
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const searchableText = [
      subscription.plan,
      subscription.facility,
      typeLabels[subscription.type],
      statusLabels[subscription.status],
    ]
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      matchesTableMonthFilter(
        subscription.createdAt,
        monthFilter,
        appTimeZone
      ) &&
      matchesStatus(subscription.status, statusFilter)
    )
  })
  const sortedSubscriptions = sortSubscriptions(filteredSubscriptions, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedSubscriptions.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedSubscriptions = sortedSubscriptions.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedSubscriptions.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedSubscriptions.length
  )
  const planSortValue =
    sort === "plan_desc" || sort === "plan_asc" ? sort : "plan_asc"
  const facilitySortValue =
    sort === "facility_desc" || sort === "facility_asc" ? sort : "facility_asc"
  const typeSortValue =
    sort === "type_pt" || sort === "type_access" ? sort : "type_access"
  const createdSortValue =
    sort === "created_asc" || sort === "created_desc" ? sort : "created_desc"
  const amountSortValue =
    sort === "amount_asc" || sort === "amount_desc" ? sort : "amount_desc"

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: StatusFilter) {
    setStatusFilter(value)
    setCurrentPage(1)
  }

  function handleMonthFilterChange(value: string) {
    setMonthFilter(value)
    setCurrentPage(1)
  }

  function handleSortChange(value: SubscriptionSort) {
    setSort(value)
    setCurrentPage(1)
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Subscription directory</CardTitle>
        <CardDescription>
          Showing {paginatedSubscriptions.length} of{" "}
          {sortedSubscriptions.length} subscriptions
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col gap-3 border-b px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <InputGroup className="w-full lg:w-96">
            <InputGroupAddon>
              <Search aria-hidden="true" />
            </InputGroupAddon>
            <InputGroupInput
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search by plan, facility, status..."
              aria-label="Search subscriptions"
            />
          </InputGroup>
          <TableMonthFilter
            value={monthFilter}
            options={monthFilterOptions}
            onValueChange={handleMonthFilterChange}
            label="Filter subscriptions by created month"
          />
        </div>

        <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="h-12 pl-6">
                <OwnerTableHeaderSelect
                  label="Plan"
                  value={planSortValue}
                  options={planSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Facility"
                  value={facilitySortValue}
                  options={facilitySortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Type"
                  value={typeSortValue}
                  options={typeSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Created"
                  value={createdSortValue}
                  options={createdSortOptions}
                  onValueChange={handleSortChange}
                />
              </TableHead>
              <TableHead className="h-12">
                <OwnerTableHeaderSelect
                  label="Status"
                  value={statusFilter}
                  options={statusFilters}
                  onValueChange={handleStatusFilterChange}
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
              <TableHead className="h-12 pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSubscriptions.length ? (
              paginatedSubscriptions.map((subscription) => (
                <TableRow key={subscription.id} className="h-[4.5rem]">
                  <TableCell className="pl-6">
                    <div className="min-w-0">
                      <p className="leading-5 font-semibold break-words">
                        {subscription.plan}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {subscription.facility}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {typeLabels[subscription.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {dateFormatter.format(new Date(subscription.createdAt))}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <StatusBadge status={subscription.status} showDot>
                      {statusLabels[subscription.status]}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap tabular-nums">
                    {currencyFormatter.format(subscription.amount)}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    <TableRowActions
                      label={`Open actions for ${subscription.plan}`}
                    >
                      <DropdownMenuItem asChild>
                        <Link href={`/subscriptions/${subscription.id}`}>
                          View detail
                        </Link>
                      </DropdownMenuItem>
                      {canCancelSubscription(subscription.status) ? (
                        <>
                          <DropdownMenuSeparator />
                          <CancelSubscriptionMenuAction
                            subscriptionId={subscription.id}
                          />
                        </>
                      ) : null}
                    </TableRowActions>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ClipboardList />
                      </EmptyMedia>
                      <EmptyTitle>No subscriptions found</EmptyTitle>
                      <EmptyDescription>
                        Try a different search term or status filter.
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
            Showing {visibleStart}-{visibleEnd} of {sortedSubscriptions.length}{" "}
            subscriptions
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
