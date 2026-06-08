"use client"

import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, UserCog } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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

function getStatusClassName(status: StaffStatus) {
  return cn(
    "border font-medium",
    status === "active" &&
      "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
    status === "on_leave" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
    status === "inactive" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    status === "terminated" &&
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20"
  )
}

export function StaffTable({ staffs, canAddStaff = false }: StaffTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("all")
  const [sort, setSort] = useState<StaffSort>("staff_asc")

  const normalizedSearch = search.trim().toLowerCase()
  const filteredStaffs = staffs.filter((staff) => {
    const searchableText = [staff.name, staff.phone, staff.role, staff.note]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      (statusFilter === "all" || staff.status === statusFilter)
    )
  })
  const sortedStaffs = sortStaffs(filteredStaffs, sort)
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

  return (
    <div className="flex flex-col gap-4">
      <InputGroup className="w-full lg:w-72">
        <InputGroupAddon>
          <Search aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search staffs..."
          aria-label="Search staffs"
        />
      </InputGroup>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Staff directory</CardTitle>
          <CardDescription>
            Showing {sortedStaffs.length} of {staffs.length} staffs
          </CardDescription>
          {canAddStaff ? (
            <CardAction>
              <Button asChild size="sm">
                <Link href="/staffs/add">
                  <CirclePlus data-icon="inline-start" />
                  Add Staff
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">
                  <OwnerTableHeaderSelect
                    label="Staff"
                    value={staffSortValue}
                    options={staffSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Role"
                    value={roleSortValue}
                    options={roleSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Phone"
                    value={phoneSortValue}
                    options={phoneSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Hired"
                    value={hiredSortValue}
                    options={hiredSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Status"
                    value={statusFilter}
                    options={statusFilters}
                    onValueChange={setStatusFilter}
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    label="Notes"
                    value={notesSortValue}
                    options={notesSortOptions}
                    onValueChange={setSort}
                  />
                </TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedStaffs.length ? (
                sortedStaffs.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="pl-4">
                      <div className="flex min-w-48 items-center gap-3">
                        <Avatar>
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
                        <p className="truncate font-medium">{staff.name}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {staff.role ? (
                        <Badge variant="secondary">{staff.role}</Badge>
                      ) : (
                        <span className="text-muted-foreground">No role</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.phone ?? "No phone number"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {staff.hiredAt
                        ? dateFormatter.format(new Date(staff.hiredAt))
                        : "Not recorded"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusClassName(staff.status)}
                      >
                        {statusLabels[staff.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="max-w-72 truncate text-muted-foreground">
                        {staff.note ?? "No notes"}
                      </p>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Open actions for ${staff.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link href={`/staffs/${staff.id}`}>
                                View staff
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
        </CardContent>
      </Card>
    </div>
  )
}
