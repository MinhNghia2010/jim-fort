"use client"

import { Fragment, useState } from "react"
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
  Card,
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

export type ManagerSubscriptionTableRow = {
  id: string
  status: string
  final_price: number | string
  created_at: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
}

type ManagerSubscriptionsTableProps = {
  rows: ManagerSubscriptionTableRow[]
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const appTimeZone = "Asia/Ho_Chi_Minh"

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: appTimeZone,
})

const month = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: appTimeZone,
})

const monthKey = new Intl.DateTimeFormat("en-US", {
  month: "2-digit",
  year: "numeric",
  timeZone: appTimeZone,
})

export function ManagerSubscriptionsTable({
  rows,
}: ManagerSubscriptionsTableProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const monthFilterOptions = getTableMonthFilterOptions(
    rows,
    (row) => row.created_at,
    appTimeZone
  )
  const filteredRows = rows.filter((row) =>
    matchesTableMonthFilter(row.created_at, monthFilter, appTimeZone)
  )

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-b py-4">
        <CardTitle>Subscription directory</CardTitle>
        <CardDescription>
          Showing {filteredRows.length} of {rows.length} subscription records.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0">
        <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
          <TableMonthFilter
            value={monthFilter}
            options={monthFilterOptions}
            onValueChange={setMonthFilter}
            label="Filter subscriptions by created month"
          />
        </div>
        <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="h-12 pl-6">Member</TableHead>
              <TableHead className="h-12">Package</TableHead>
              <TableHead className="h-12 whitespace-nowrap">Date</TableHead>
              <TableHead className="h-12 whitespace-nowrap">Status</TableHead>
              <TableHead className="h-12 text-right whitespace-nowrap">
                Amount
              </TableHead>
              <TableHead className="h-12 pr-6 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length ? (
              filteredRows.map((row, index) => {
                const createdAt = new Date(row.created_at)
                const previousRow = filteredRows[index - 1]
                const currentMonthKey = monthKey.format(createdAt)
                const previousMonthKey = previousRow
                  ? monthKey.format(new Date(previousRow.created_at))
                  : null
                const showMonth = currentMonthKey !== previousMonthKey

                return (
                  <Fragment key={row.id}>
                    {showMonth ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="bg-muted/50 py-2 pl-6 text-xs font-medium text-muted-foreground"
                        >
                          {month.format(createdAt)}
                        </TableCell>
                      </TableRow>
                    ) : null}
                    <TableRow className="h-[4.5rem]">
                      <TableCell className="pl-6 font-medium">
                        {row.users?.full_name ?? "Member"}
                      </TableCell>
                      <TableCell>
                        {row.membership_packages?.name ?? "Membership"}
                      </TableCell>
                      <TableCell className="font-mono text-xs whitespace-nowrap text-muted-foreground">
                        {date.format(createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge status={row.status} showDot />
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap tabular-nums">
                        {currency.format(Number(row.final_price) || 0)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <TableRowActions
                          label={`Open actions for ${row.users?.full_name ?? "member"}`}
                          actions={[
                            {
                              href: `/subscriptions/${row.id}`,
                              label: "View detail",
                            },
                          ]}
                        />
                      </TableCell>
                    </TableRow>
                  </Fragment>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-64">
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <ClipboardList />
                      </EmptyMedia>
                      <EmptyTitle>No subscriptions found</EmptyTitle>
                      <EmptyDescription>
                        Membership subscription records will appear here.
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
  )
}
