"use client"

import { ReceiptText } from "lucide-react"

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
import { useState } from "react"

export type MemberPaymentTableRow = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  subscription_id: string
}

interface MemberPaymentsTableProps {
  payments: readonly MemberPaymentTableRow[]
}

const appTimeZone = "Asia/Ho_Chi_Minh"

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: appTimeZone,
})

function getPaymentDate(payment: MemberPaymentTableRow) {
  return payment.paid_at ?? payment.created_at
}

export function MemberPaymentsTable({ payments }: MemberPaymentsTableProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const monthFilterOptions = getTableMonthFilterOptions(
    payments,
    getPaymentDate,
    appTimeZone
  )
  const filteredPayments = payments.filter((payment) =>
    matchesTableMonthFilter(getPaymentDate(payment), monthFilter, appTimeZone)
  )

  return (
    <>
      <div className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-end">
        <TableMonthFilter
          value={monthFilter}
          options={monthFilterOptions}
          onValueChange={setMonthFilter}
          label="Filter payments by month"
        />
      </div>
      <Table className="table-auto text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
        <TableHeader className="bg-muted/40">
          <TableRow>
            <TableHead className="h-12 pl-6">Amount</TableHead>
            <TableHead className="h-12">Status</TableHead>
            <TableHead className="h-12">Method</TableHead>
            <TableHead className="h-12">Date</TableHead>
            <TableHead className="h-12 w-[10%] text-center">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredPayments.length ? (
            filteredPayments.map((payment) => (
              <TableRow key={payment.id} className="h-[4.5rem]">
                <TableCell className="pl-6 font-medium whitespace-nowrap">
                  {currency.format(Number(payment.amount) || 0)}
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <StatusBadge status={payment.status} showDot />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {payment.method ?? "Not set"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {date.format(new Date(getPaymentDate(payment)))}
                </TableCell>
                <TableCell className="w-[10%] text-center">
                  <TableRowActions
                    label="Open payment actions"
                    actions={[
                      {
                        href: `/payments/${payment.id}`,
                        label: "Details",
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
                      <ReceiptText />
                    </EmptyMedia>
                    <EmptyTitle>No payments found</EmptyTitle>
                    <EmptyDescription>
                      Choose a different month to view payment records.
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
