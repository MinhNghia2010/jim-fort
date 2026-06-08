import { Fragment } from "react"
import Link from "next/link"

import { PageShell } from "@/components/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/server"

type Row = {
  id: string
  status: string
  final_price: number | string
  created_at: string
  users: { full_name: string | null } | null
  membership_packages: { name: string | null } | null
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

const statusLabels: Record<string, string> = {
  pending_pt_setup: "Pending PT setup",
  pending_payment: "Pending payment",
  active: "Active",
  expired: "Expired",
  cancelled: "Cancelled",
}

function statusClassName(status: string) {
  return cn(
    "border font-medium",
    status === "active" &&
      "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
    (status === "pending_payment" || status === "pending_pt_setup") &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
    status === "expired" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    status === "cancelled" &&
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20"
  )
}

function getStatusLabel(status: string) {
  return statusLabels[status] ?? status.replaceAll("_", " ")
}

function sortByCreatedAtDesc(rows: Row[]) {
  return [...rows].sort(
    (first, second) =>
      new Date(second.created_at).getTime() -
      new Date(first.created_at).getTime()
  )
}

export async function ManagerSubscriptionsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,final_price,created_at,users:member_id(full_name),membership_packages(name)"
    )
    .order("created_at", { ascending: false })

  const rows = sortByCreatedAtDesc((data ?? []) as unknown as Row[])

  return (
    <PageShell
      eyebrow="Manager"
      title="Subscriptions"
      description="Monitor member subscriptions across setup, payment, and activation."
    >
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => {
              const createdAt = new Date(row.created_at)
              const previousRow = rows[index - 1]
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
                        className="bg-muted/40 py-2 text-xs font-medium text-muted-foreground"
                      >
                        {month.format(createdAt)}
                      </TableCell>
                    </TableRow>
                  ) : null}
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">
                      {row.users?.full_name ?? "Member"}
                    </TableCell>
                    <TableCell>
                      {row.membership_packages?.name ?? "Membership"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {date.format(createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusClassName(row.status)}>
                        {getStatusLabel(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currency.format(Number(row.final_price) || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/request/${row.id}`}>Open</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </PageShell>
  )
}
