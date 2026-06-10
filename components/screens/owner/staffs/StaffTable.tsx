"use client"

import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, UserCog } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

export type StaffStatus = "active" | "inactive" | "on_leave" | "terminated"

export interface StaffTableRow {
  id: string
  name: string
  phone: string | null
  avatarUrl: string | null
  role: string | null
  status: StaffStatus
  hiredAt: string | null
  note: string | null
}

interface StaffTableProps {
  staffs: StaffTableRow[]
  canAddStaff?: boolean
  monthFilter?: string
  onMonthFilterChange?: (value: string) => void
}

const statusFilters = [
  { value: "all", label: "All Staffs" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "inactive", label: "Inactive" },
  { value: "terminated", label: "Terminated" },
] as const

type StaffStatusFilter = (typeof statusFilters)[number]["value"]

const staffSortOptions = [
  { value: "staff_asc", label: "A-Z" },
  { value: "staff_desc", label: "Z-A" },
] as const

const roleSortOptions = [
  { value: "role_asc", label: "A-Z" },
  { value: "role_desc", label: "Z-A" },
] as const

const phoneSortOptions = [
  { value: "phone_asc", label: "A-Z" },
  { value: "phone_desc", label: "Z-A" },
] as const

const hiredSortOptions = [
  { value: "hired_desc", label: "Latest" },
  { value: "hired_asc", label: "Oldest" },
] as const

const notesSortOptions = [
  { value: "notes_asc", label: "A-Z" },
  { value: "notes_desc", label: "Z-A" },
] as const

type StaffSort =
  | (typeof staffSortOptions)[number]["value"]
  | (typeof roleSortOptions)[number]["value"]
  | (typeof phoneSortOptions)[number]["value"]
  | (typeof hiredSortOptions)[number]["value"]
  | (typeof notesSortOptions)[number]["value"]

const statusLabels: Record<StaffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On leave",
  terminated: "Terminated",
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: "UTC",
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
      .toUpperCase() || "S"
  )
}

function compareText(first: string | null, second: string | null) {
  return (first ?? "").localeCompare(second ?? "", undefined, {
    sensitivity: "base",
  })
}

function getDateValue(value: string | null) {
  return value ? new Date(value).getTime() : 0
}

function sortStaffs(staffs: StaffTableRow[], sort: StaffSort) {
  return [...staffs].sort((first, second) => {
    if (sort === "staff_asc") {
      return compareText(first.name, second.name)
    }

    if (sort === "staff_desc") {
      return compareText(second.name, first.name)
    }

    if (sort === "role_asc") {
      return compareText(first.role, second.role)
    }

    if (sort === "role_desc") {
      return compareText(second.role, first.role)
    }

    if (sort === "phone_asc") {
      return compareText(first.phone, second.phone)
    }

    if (sort === "phone_desc") {
      return compareText(second.phone, first.phone)
    }

    if (sort === "hired_asc") {
      return getDateValue(first.hiredAt) - getDateValue(second.hiredAt)
    }

    if (sort === "notes_asc") {
      return compareText(first.note, second.note)
    }

    if (sort === "notes_desc") {
      return compareText(second.note, first.note)
    }

    return getDateValue(second.hiredAt) - getDateValue(first.hiredAt)
  })
}

export function StaffTable({
  staffs,
  canAddStaff = false,
  monthFilter: controlledMonthFilter,
  onMonthFilterChange,
}: StaffTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("all")
  const [internalMonthFilter, setInternalMonthFilter] =
    useState(ALL_MONTHS_VALUE)
  const [sort, setSort] = useState<StaffSort>("staff_asc")
  const [currentPage, setCurrentPage] = useState(1)

  const monthFilter = controlledMonthFilter ?? internalMonthFilter
  const normalizedSearch = search.trim().toLowerCase()
  const monthFilterOptions = getTableMonthFilterOptions(
    staffs,
    (staff) => staff.hiredAt
  )
  const filteredStaffs = staffs.filter((staff) => {
    const searchableText = [staff.name, staff.phone, staff.role, staff.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      matchesTableMonthFilter(staff.hiredAt, monthFilter) &&
      (statusFilter === "all" || staff.status === statusFilter)
    )
  })
  const sortedStaffs = sortStaffs(filteredStaffs, sort)
  const totalPages = Math.max(
    1,
    Math.ceil(sortedStaffs.length / TABLE_ROWS_PER_PAGE)
  )
  const activePage = Math.min(currentPage, totalPages)
  const startIndex = (activePage - 1) * TABLE_ROWS_PER_PAGE
  const paginatedStaffs = sortedStaffs.slice(
    startIndex,
    startIndex + TABLE_ROWS_PER_PAGE
  )
  const visibleStart = paginatedStaffs.length ? startIndex + 1 : 0
  const visibleEnd = Math.min(
    startIndex + TABLE_ROWS_PER_PAGE,
    sortedStaffs.length
  )
  const staffSortValue =
    sort === "staff_desc" || sort === "staff_asc" ? sort : "staff_asc"
  const roleSortValue =
    sort === "role_desc" || sort === "role_asc" ? sort : "role_asc"
  const phoneSortValue =
    sort === "phone_desc" || sort === "phone_asc" ? sort : "phone_asc"
  const hiredSortValue =
    sort === "hired_asc" || sort === "hired_desc" ? sort : "hired_desc"
  const notesSortValue =
    sort === "notes_desc" || sort === "notes_asc" ? sort : "notes_asc"

  function handleSearchChange(value: string) {
    setSearch(value)
    setCurrentPage(1)
  }

  function handleSortChange(value: StaffSort) {
    setSort(value)
    setCurrentPage(1)
  }

  function handleStatusFilterChange(value: StaffStatusFilter) {
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
          <CardTitle>Staff directory</CardTitle>
          <CardDescription>
            Showing {paginatedStaffs.length} of {sortedStaffs.length} staffs
          </CardDescription>
          {canAddStaff ? (
            <CardAction>
              <TableActionButton asChild tone="create">
                <Link href="/staffs/add">
                  <CirclePlus data-icon="inline-start" />
                  Add Staff
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
                placeholder="Search by staff, role, phone, note..."
                aria-label="Search staffs"
              />
            </InputGroup>
            <TableMonthFilter
              value={monthFilter}
              options={monthFilterOptions}
              onValueChange={handleMonthFilterChange}
              label="Filter staffs by hired month"
            />
          </div>

          <Table className="min-w-[1040px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[12%]" />
              <col className="w-[13%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[17%]" />
              <col className="w-[6%]" />
            </colgroup>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="h-12 pl-6">
                  <OwnerTableHeaderSelect
                    label="Staff"
                    value={staffSortValue}
                    options={staffSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Role"
                    value={roleSortValue}
                    options={roleSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Phone"
                    value={phoneSortValue}
                    options={phoneSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12">
                  <OwnerTableHeaderSelect
                    label="Hired"
                    value={hiredSortValue}
                    options={hiredSortOptions}
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
                    label="Notes"
                    value={notesSortValue}
                    options={notesSortOptions}
                    onValueChange={handleSortChange}
                  />
                </TableHead>
                <TableHead className="h-12 pr-6 text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaffs.length ? (
                paginatedStaffs.map((staff) => (
                  <TableRow key={staff.id} className="h-[4.5rem]">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {staff.avatarUrl ? (
                            <AvatarImage
                              src={staff.avatarUrl}
                              alt={staff.name}
                            />
                          ) : null}
                          <AvatarFallback>
                            {getInitials(staff.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="leading-5 font-semibold break-words">
                            {staff.name}
                          </p>
                          <p className="text-xs break-words text-muted-foreground">
                            {staff.role ?? "Staff member"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {staff.role ? (
                        <span className="font-medium">{staff.role}</span>
                      ) : (
                        <span className="text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {staff.phone ?? "No phone number"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {staff.hiredAt
                        ? dateFormatter.format(new Date(staff.hiredAt))
                        : "Not recorded"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <StatusBadge status={staff.status} showDot>
                        {statusLabels[staff.status]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="overflow-hidden">
                      <p className="truncate text-muted-foreground">
                        {staff.note ?? "No notes"}
                      </p>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <TableActionIconButton
                              aria-label={`Open actions for ${staff.name}`}
                            >
                              <MoreHorizontal />
                            </TableActionIconButton>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <Link href={`/staffs/${staff.id}`}>
                                  View staff
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/staffs/${staff.id}/edit`}>
                                  Edit staff
                                </Link>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-64">
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <UserCog />
                        </EmptyMedia>
                        <EmptyTitle>No staffs found</EmptyTitle>
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
              Showing {visibleStart}-{visibleEnd} of {sortedStaffs.length}{" "}
              staffs
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
