"use client"

import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, Users } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  TableActionButton,
  TableActionIconButton,
} from "@/components/TableActionButton"
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
import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
import { cn } from "@/lib/utils"

export type MemberStatus =
  | "pending_pt_setup"
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled"

export interface MemberTableRow {
  id: string
  name: string
  phone: string | null
  avatarUrl: string | null
  plan: string
  joinedAt: string
  status: MemberStatus
  sessions: number
  revenue: number
}

interface MembersTableProps {
  members: MemberTableRow[]
  canAddMember?: boolean
  monthFilter?: string
  onMonthFilterChange?: (value: string) => void
}

const statusFilters = [
  { value: "all", label: "All Members" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const

type MemberStatusFilter = (typeof statusFilters)[number]["value"]

const memberSortOptions = [
  { value: "member_asc", label: "A-Z" },
  { value: "member_desc", label: "Z-A" },
] as const

const planSortOptions = [
  { value: "plan_asc", label: "A-Z" },
  { value: "plan_desc", label: "Z-A" },
] as const

const joinedSortOptions = [
  { value: "joined_desc", label: "Latest" },
  { value: "joined_asc", label: "Oldest" },
] as const

const sessionsSortOptions = [
  { value: "sessions_desc", label: "High-Low" },
  { value: "sessions_asc", label: "Low-High" },
] as const

const revenueSortOptions = [
  { value: "revenue_desc", label: "High-Low" },
  { value: "revenue_asc", label: "Low-High" },
] as const

type MemberSort =
  | (typeof memberSortOptions)[number]["value"]
  | (typeof planSortOptions)[number]["value"]
  | (typeof joinedSortOptions)[number]["value"]
  | (typeof sessionsSortOptions)[number]["value"]
  | (typeof revenueSortOptions)[number]["value"]

const statusLabels: Record<MemberStatus, string> = {
  pending_pt_setup: "Pending PT setup",
  pending_payment: "Pending payment",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
})

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "M"
  )
}

function matchesStatus(status: MemberStatus, filter: MemberStatusFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "pending") {
    return status === "pending_payment" || status === "pending_pt_setup"
  }

  return status === filter
}

function compareText(first: string, second: string) {
  return first.localeCompare(second, undefined, { sensitivity: "base" })
}

function compareDate(first: string, second: string) {
  return new Date(first).getTime() - new Date(second).getTime()
}

function sortMembers(members: MemberTableRow[], sort: MemberSort) {
  return [...members].sort((first, second) => {
    if (sort === "member_asc") {
      return compareText(first.name, second.name)
    }

    if (sort === "member_desc") {
      return compareText(second.name, first.name)
    }

    if (sort === "plan_asc") {
      return compareText(first.plan, second.plan)
    }

    if (sort === "plan_desc") {
      return compareText(second.plan, first.plan)
    }

    if (sort === "joined_asc") {
      return compareDate(first.joinedAt, second.joinedAt)
    }

    if (sort === "sessions_desc") {
      return second.sessions - first.sessions
    }

    if (sort === "sessions_asc") {
      return first.sessions - second.sessions
    }

    if (sort === "revenue_desc") {
      return second.revenue - first.revenue
    }

    if (sort === "revenue_asc") {
      return first.revenue - second.revenue
    }

    return compareDate(second.joinedAt, first.joinedAt)
  })
}

function getStatusClassName(status: MemberStatus) {
  return cn(
    "border font-medium",
    status === "active" &&
      "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
    (status === "pending_payment" || status === "pending_pt_setup") &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
    (status === "expired" || status === "cancelled") &&
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20"
  )
}

export function MembersTable({
  members,
  canAddMember = false,
  monthFilter: controlledMonthFilter,
  onMonthFilterChange,
}: MembersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all")
  const [internalMonthFilter, setInternalMonthFilter] =
    useState(ALL_MONTHS_VALUE)
  const [sort, setSort] = useState<MemberSort>("joined_desc")
  const [currentPage, setCurrentPage] = useState(1)

  const monthFilter = controlledMonthFilter ?? internalMonthFilter
  const normalizedSearch = search.trim().toLowerCase()
  const monthFilterOptions = getTableMonthFilterOptions(
    members,
    (member) => member.joinedAt
  )
  const filteredMembers = members.filter((member) => {
    const searchableText = [member.name, member.phone, member.plan]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      matchesTableMonthFilter(member.joinedAt, monthFilter) &&
      matchesStatus(member.status, statusFilter)
    )
  })
  const sortedMembers = sortMembers(filteredMembers, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedMembers.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedMembers = sortedMembers.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedMembers.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedMembers.length
  )
  const memberSortValue =
    sort === "member_desc" || sort === "member_asc" ? sort : "member_asc"
  const planSortValue =
    sort === "plan_desc" || sort === "plan_asc" ? sort : "plan_asc"
  const joinedSortValue =
    sort === "joined_asc" || sort === "joined_desc" ? sort : "joined_desc"
  const sessionsSortValue =
    sort === "sessions_asc" || sort === "sessions_desc" ? sort : "sessions_desc"
  const revenueSortValue =
    sort === "revenue_asc" || sort === "revenue_desc" ? sort : "revenue_desc"

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleSortChange(value: MemberSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: MemberStatusFilter) {
    setStatusFilter(value)
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
    <div className="flex flex-col gap-4">
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Member directory</CardTitle>
          <CardDescription>
            Showing {paginatedMembers.length} of {sortedMembers.length} members
          </CardDescription>
          {canAddMember ? (
            <CardAction>
              <TableActionButton asChild tone="create">
                <Link href="/members/create">
                  <CirclePlus data-icon="inline-start" />
                  Add Member
                </Link>
              </TableActionButton>
            </CardAction>
          ) : null}
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
                placeholder="Search members..."
                aria-label="Search members"
              />
            </InputGroup>
            <TableMonthFilter
              value={monthFilter}
              options={monthFilterOptions}
              onValueChange={handleMonthFilterChange}
              label="Filter members by joined month"
            />
          </div>

          <Table className="min-w-[1020px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[20%]" />
              <col className="w-[13%]" />
              <col className="w-[15%]" />
              <col className="w-[8%]" />
              <col className="w-[9%]" />
              <col className="w-[7%]" />
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
                    label="Plan"
                    value={planSortValue}
                    options={planSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Joined"
                    value={joinedSortValue}
                    options={joinedSortOptions}
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
                    label="Sessions"
                    value={sessionsSortValue}
                    options={sessionsSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Revenue"
                    value={revenueSortValue}
                    options={revenueSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12 pr-6 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMembers.length ? (
                paginatedMembers.map((member) => (
                  <TableRow key={member.id} className="h-[4.5rem]">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {member.avatarUrl ? (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.name}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="leading-5 font-medium break-words">
                            {member.name}
                          </p>
                          <p className="text-xs break-words text-muted-foreground">
                            {member.phone ?? "No phone number"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.plan}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {dateFormatter.format(new Date(member.joinedAt))}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={getStatusClassName(member.status)}
                      >
                        {statusLabels[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums whitespace-nowrap">
                      {member.sessions}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums whitespace-nowrap">
                      {currencyFormatter.format(member.revenue)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <TableActionIconButton
                            aria-label={`Open actions for ${member.name}`}
                          >
                            <MoreHorizontal />
                          </TableActionIconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/members/${member.id}`}>
                                View member
                              </Link>
                            </DropdownMenuItem>
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
                          <Users />
                        </EmptyMedia>
                        <EmptyTitle>No members found</EmptyTitle>
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
              Showing {visibleStart}-{visibleEnd} of {sortedMembers.length}{" "}
              members
            </span>
            <TablePagination
              activePage={activePage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
