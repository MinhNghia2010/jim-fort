"use client"

import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, UserCog } from "lucide-react"

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
                <TableHead className="pl-4">Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Hired</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
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
