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

export type ManagerRequestTableRow = {
  id: string
  status: string
  has_pt_snapshot: boolean
  created_at: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

interface ManagerRequestsTableProps {
  requests: readonly ManagerRequestTableRow[]
}

const appTimeZone = "Asia/Ho_Chi_Minh"

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: appTimeZone,
})

export function ManagerRequestsTable({ requests }: ManagerRequestsTableProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const monthFilterOptions = getTableMonthFilterOptions(
    requests,
    (request) => request.created_at,
    appTimeZone
  )
  const filteredRequests = requests.filter((request) =>
    matchesTableMonthFilter(request.created_at, monthFilter, appTimeZone)
  )

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <TableMonthFilter
          value={monthFilter}
          options={monthFilterOptions}
          onValueChange={setMonthFilter}
          label="Filter requests by created month"
        />
      </div>
      <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">Member</TableHead>
            <TableHead className="h-12">Package</TableHead>
            <TableHead className="h-12">Status</TableHead>
            <TableHead className="h-12">Created</TableHead>
            <TableHead className="h-12 pr-6 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredRequests.length ? (
            filteredRequests.map((request) => (
              <TableRow key={request.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-medium">
                  {request.users?.full_name ?? "Member"}
                </TableCell>
                <TableCell>
                  {request.membership_packages?.name ?? "Membership"}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge status={request.status} showDot />
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {date.format(new Date(request.created_at))}
                </TableCell>
                <TableCell className="pr-6 text-right">
                  <TableRowActions
                    label={`Open actions for ${request.users?.full_name ?? "member"}`}
                    actions={[
                      {
                        href: `/request/${request.id}`,
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
                    <EmptyTitle>No requests found</EmptyTitle>
                    <EmptyDescription>
                      Choose a different month to view pending requests.
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
