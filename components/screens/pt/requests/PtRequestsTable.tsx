"use client"

import { useState } from "react"
import { ClipboardList } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
import { TableRowActions } from "@/components/TableRowActions"
import {
  ALL_MONTHS_VALUE,
  getTableMonthFilterOptions,
  matchesTableMonthFilter,
  TableMonthFilter,
} from "@/components/TableMonthFilter"
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

export type PtAssignmentTableRow = {
  id: string
  subscription_id: string
  status: string
  schedule_starts_on: string | null
  schedule_note: string | null
  assigned_at: string
  membership_subscriptions: {
    id: string
    status: string
    users: { full_name: string | null; phone: string | null } | null
    membership_packages: { name: string | null } | null
  } | null
}

interface PtRequestsTableProps {
  assignments: readonly PtAssignmentTableRow[]
}

const appTimeZone = "Asia/Ho_Chi_Minh"

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: appTimeZone,
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

export function PtRequestsTable({ assignments }: PtRequestsTableProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const monthFilterOptions = getTableMonthFilterOptions(
    assignments,
    (assignment) => assignment.schedule_starts_on,
    appTimeZone
  )
  const filteredAssignments = assignments.filter((assignment) =>
    matchesTableMonthFilter(
      assignment.schedule_starts_on,
      monthFilter,
      appTimeZone
    )
  )

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <TableMonthFilter
          value={monthFilter}
          options={monthFilterOptions}
          onValueChange={setMonthFilter}
          label="Filter PT requests by start month"
        />
      </div>
      <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">Member</TableHead>
            <TableHead className="h-12">Package</TableHead>
            <TableHead className="h-12">Status</TableHead>
            <TableHead className="h-12">Start</TableHead>
            <TableHead className="h-12 w-[10%] text-center">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAssignments.length ? (
            filteredAssignments.map((assignment) => (
              <TableRow key={assignment.id} className="h-[4.5rem]">
                <TableCell className="pl-6">
                  <p className="font-medium">
                    {assignment.membership_subscriptions?.users?.full_name ??
                      "Member"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assignment.membership_subscriptions?.users?.phone ??
                      "No phone number"}
                  </p>
                </TableCell>
                <TableCell>
                  {assignment.membership_subscriptions?.membership_packages
                    ?.name ?? "Membership"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge status={assignment.status} showDot />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(assignment.schedule_starts_on)}
                </TableCell>
                <TableCell className="w-[10%] text-center">
                  <TableRowActions
                    label={`Open actions for ${
                      assignment.membership_subscriptions?.users?.full_name ??
                      "member"
                    }`}
                    actions={[
                      {
                        href: `/request/${assignment.subscription_id}`,
                        label: "Open",
                      },
                    ]}
                  />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-64">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ClipboardList />
                    </EmptyMedia>
                    <EmptyTitle>No PT requests found</EmptyTitle>
                    <EmptyDescription>
                      Choose a different month to view assignment requests.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  )
}
