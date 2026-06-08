import Link from "next/link"
import { ReceiptText } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@/lib/supabase/server"

type PaymentRow = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  subscription_id: string
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const date = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export async function MemberPaymentsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_payments")
    .select("id,amount,method,status,paid_at,created_at,subscription_id")
    .order("created_at", { ascending: false })

  const payments = (data ?? []) as unknown as PaymentRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Payments"
      description="View membership payment attempts and completed payments."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Payments could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {payments.length ? (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    {currency.format(Number(payment.amount) || 0)}
                  </TableCell>
                  <TableCell>
                    <Badge>{payment.status}</Badge>
                  </TableCell>
                  <TableCell>{payment.method ?? "Not set"}</TableCell>
                  <TableCell>
                    {date.format(new Date(payment.paid_at ?? payment.created_at))}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/subscriptions/${payment.subscription_id}`}>
                        Subscription
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ReceiptText />
            </EmptyMedia>
            <EmptyTitle>No payments yet</EmptyTitle>
            <EmptyDescription>Payments appear here after checkout.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
