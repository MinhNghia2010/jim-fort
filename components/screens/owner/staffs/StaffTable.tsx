"use client"

<<<<<<< HEAD
import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, UserCog } from "lucide-react"

=======
import { useMemo, useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, UserCog } from "lucide-react"

import { OwnerTableHeaderSelect } from "@/components/screens/owner/OwnerTableHeaderSelect"
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

<<<<<<< HEAD
=======
type StaffSortOption =
  | "staff_az"
  | "staff_za"
  | "role_az"
  | "role_za"
  | "phone_az"
  | "phone_za"
  | "hired_latest"
  | "hired_oldest"
  | "notes_az"
  | "notes_za"

>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
const statusLabels: Record<StaffStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On leave",
  terminated: "Terminated",
}

<<<<<<< HEAD
=======
const staffSortOptions = [
  { value: "staff_az", label: "Staff: A-Z" },
  { value: "staff_za", label: "Staff: Z-A" },
] as const

const roleSortOptions = [
  { value: "role_az", label: "Role: A-Z" },
  { value: "role_za", label: "Role: Z-A" },
] as const

const phoneSortOptions = [
  { value: "phone_az", label: "Phone: A-Z" },
  { value: "phone_za", label: "Phone: Z-A" },
] as const

const hiredSortOptions = [
  { value: "hired_latest", label: "Hired: Latest" },
  { value: "hired_oldest", label: "Hired: Oldest" },
] as const

const notesSortOptions = [
  { value: "notes_az", label: "Notes: A-Z" },
  { value: "notes_za", label: "Notes: Z-A" },
] as const

const statusHeaderOptions = statusFilters.map((filter) => ({
  value: filter.value,
  label: filter.value === "all" ? "Status: All" : `Status: ${filter.label}`,
}))

const staffSortValues: readonly StaffSortOption[] = [
  "staff_az",
  "staff_za",
  "role_az",
  "role_za",
  "phone_az",
  "phone_za",
  "hired_latest",
  "hired_oldest",
  "notes_az",
  "notes_za",
]

>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
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

<<<<<<< HEAD
export function StaffTable({ staffs, canAddStaff = false }: StaffTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("all")

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
=======
function isStaffSortOption(value: string): value is StaffSortOption {
  return staffSortValues.includes(value as StaffSortOption)
}

function getHeaderSortValue(
  sortOption: StaffSortOption,
  values: readonly StaffSortOption[],
  fallback: string
) {
  return values.includes(sortOption) ? sortOption : fallback
}

function getSortLabel(
  sortOption: StaffSortOption,
  options: readonly { value: StaffSortOption; label: string }[],
  fallback: string
) {
  return (
    options.find((option) => option.value === sortOption)?.label ?? fallback
  )
}

function getStatusFilterLabel(statusFilter: StaffStatusFilter) {
  return (
    statusHeaderOptions.find((option) => option.value === statusFilter)
      ?.label ?? "Status"
  )
}

function compareNullableText(first: string | null, second: string | null) {
  return (first ?? "").localeCompare(second ?? "")
}

function compareNullableDate(first: string | null, second: string | null) {
  if (!first && !second) {
    return 0
  }

  if (!first) {
    return 1
  }

  if (!second) {
    return -1
  }

  return first.localeCompare(second)
}

function sortStaffs(
  staffs: readonly StaffTableRow[],
  sortOption: StaffSortOption
) {
  return [...staffs].sort((first, second) => {
    if (sortOption === "staff_az") {
      return first.name.localeCompare(second.name)
    }

    if (sortOption === "staff_za") {
      return second.name.localeCompare(first.name)
    }

    if (sortOption === "role_az") {
      return compareNullableText(first.role, second.role)
    }

    if (sortOption === "role_za") {
      return compareNullableText(second.role, first.role)
    }

    if (sortOption === "phone_az") {
      return compareNullableText(first.phone, second.phone)
    }

    if (sortOption === "phone_za") {
      return compareNullableText(second.phone, first.phone)
    }

    if (sortOption === "hired_latest") {
      return compareNullableDate(second.hiredAt, first.hiredAt)
    }

    if (sortOption === "hired_oldest") {
      return compareNullableDate(first.hiredAt, second.hiredAt)
    }

    if (sortOption === "notes_az") {
      return compareNullableText(first.note, second.note)
    }

    return compareNullableText(second.note, first.note)
  })
}

export function StaffTable({ staffs, canAddStaff = false }: StaffTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StaffStatusFilter>("all")
  const [sortOption, setSortOption] = useState<StaffSortOption>("staff_az")
  const updateSortOption = (value: string) => {
    if (isStaffSortOption(value)) {
      setSortOption(value)
    }
  }

  const filteredStaffs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const matchingStaffs = staffs.filter((staff) => {
      const searchableText = [staff.name, staff.phone, staff.role, staff.note]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return (
        (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
        (statusFilter === "all" || staff.status === statusFilter)
      )
    })

    return sortStaffs(matchingStaffs, sortOption)
  }, [staffs, search, statusFilter, sortOption])
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
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

          <ToggleGroup
            type="single"
            value={statusFilter}
            onValueChange={(value) => {
              if (value) {
                setStatusFilter(value as StaffStatusFilter)
              }
            }}
            variant="outline"
            size="sm"
            className="max-w-full overflow-x-auto"
            aria-label="Filter staffs by status"
          >
            {statusFilters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {canAddStaff ? (
          <Button asChild className="self-start lg:self-auto">
            <Link href="/staffs/add">
              <CirclePlus data-icon="inline-start" />
              Add Staff
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Staff directory</CardTitle>
          <CardDescription>
            Showing {filteredStaffs.length} of {staffs.length} staffs
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
<<<<<<< HEAD
                <TableHead className="pl-4">Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Hired</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
=======
                <TableHead className="pl-4">
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["staff_az", "staff_za"],
                      "staff"
                    )}
                    label={getSortLabel(sortOption, staffSortOptions, "Staff")}
                    options={[
                      { value: "staff", label: "Staff", disabled: true },
                      ...staffSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort staffs"
                    className="w-40"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["role_az", "role_za"],
                      "role"
                    )}
                    label={getSortLabel(sortOption, roleSortOptions, "Role")}
                    options={[
                      { value: "role", label: "Role", disabled: true },
                      ...roleSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort roles"
                    className="w-32"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["phone_az", "phone_za"],
                      "phone"
                    )}
                    label={getSortLabel(sortOption, phoneSortOptions, "Phone")}
                    options={[
                      { value: "phone", label: "Phone", disabled: true },
                      ...phoneSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort phone numbers"
                    className="w-36"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["hired_latest", "hired_oldest"],
                      "hired"
                    )}
                    label={getSortLabel(sortOption, hiredSortOptions, "Hired")}
                    options={[
                      { value: "hired", label: "Hired", disabled: true },
                      ...hiredSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort hired dates"
                    className="w-40"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={statusFilter}
                    label={getStatusFilterLabel(statusFilter)}
                    options={statusHeaderOptions}
                    onValueChange={(value) =>
                      setStatusFilter(value as StaffStatusFilter)
                    }
                    ariaLabel="Filter staffs by status"
                    className="w-40"
                  />
                </TableHead>
                <TableHead>
                  <OwnerTableHeaderSelect
                    value={getHeaderSortValue(
                      sortOption,
                      ["notes_az", "notes_za"],
                      "notes"
                    )}
                    label={getSortLabel(sortOption, notesSortOptions, "Notes")}
                    options={[
                      { value: "notes", label: "Notes", disabled: true },
                      ...notesSortOptions,
                    ]}
                    onValueChange={updateSortOption}
                    ariaLabel="Sort notes"
                    className="w-36"
                  />
                </TableHead>
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaffs.length ? (
                filteredStaffs.map((staff) => (
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
