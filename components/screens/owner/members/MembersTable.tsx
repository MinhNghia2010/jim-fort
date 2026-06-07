"use client"

import { useState } from "react"
import Link from "next/link"
import { CirclePlus, MoreHorizontal, Search, Users } from "lucide-react"

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
}

const statusFilters = [
  { value: "all", label: "All Members" },
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
] as const

type MemberStatusFilter = (typeof statusFilters)[number]["value"]

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
}: MembersTableProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<MemberStatusFilter>("all")

  const normalizedSearch = search.trim().toLowerCase()
  const filteredMembers = members.filter((member) => {
    const searchableText = [member.name, member.phone, member.plan]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return (
      (!normalizedSearch || searchableText.includes(normalizedSearch)) &&
      matchesStatus(member.status, statusFilter)
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
              placeholder="Search members..."
              aria-label="Search members"
            />
          </InputGroup>

          <ToggleGroup
            type="single"
            value={statusFilter}
            onValueChange={(value) => {
              if (value) {
                setStatusFilter(value as MemberStatusFilter)
              }
            }}
            variant="outline"
            size="sm"
            className="max-w-full overflow-x-auto"
            aria-label="Filter members by status"
          >
            {statusFilters.map((filter) => (
              <ToggleGroupItem key={filter.value} value={filter.value}>
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {canAddMember ? (
          <Button asChild className="self-start lg:self-auto">
            <Link href="/members/create">
              <CirclePlus data-icon="inline-start" />
              Add Member
            </Link>
          </Button>
        ) : null}
      </div>

      <Card className="gap-0 py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Member directory</CardTitle>
          <CardDescription>
            Showing {filteredMembers.length} of {members.length} members
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Member</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead className="pr-4 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMembers.length ? (
                filteredMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="pl-4">
                      <div className="flex min-w-48 items-center gap-3">
                        <Avatar>
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
                          <p className="truncate font-medium">{member.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.phone ?? "No phone number"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{member.plan}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {dateFormatter.format(new Date(member.joinedAt))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusClassName(member.status)}
                      >
                        {statusLabels[member.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {member.sessions}
                    </TableCell>
                    <TableCell className="font-medium tabular-nums">
                      {currencyFormatter.format(member.revenue)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Open actions for ${member.name}`}
                          >
                            <MoreHorizontal />
                          </Button>
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
        </CardContent>
      </Card>
    </div>
  )
}
