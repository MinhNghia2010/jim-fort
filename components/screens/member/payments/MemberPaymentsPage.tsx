import Link from "next/link"
import { ReceiptText } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

type PaymentRow = {
  id: string
  subscription_id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  membership_subscriptions: {
    membership_packages: { name: string | null } | null
  } | null
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value) || 0)
}

function formatDate(value: string | null) {
  return dateFormatter.format(new Date(value ?? Date.now()))
}

function statusVariant(status: string) {
  if (status === "paid") {
    return "default" as const
  }

  if (status === "failed" || status === "cancelled" || status === "refunded") {
    return "outline" as const
  }

  return "secondary" as const
}

export async function MemberPaymentsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_payments")
    .select(
      "id,subscription_id,amount,method,status,paid_at,created_at,membership_subscriptions(membership_packages(name))"
    )
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
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle>
                      {payment.membership_subscriptions?.membership_packages
                        ?.name ?? "Membership payment"}
                    </CardTitle>
                    <CardDescription>
                      {payment.method ?? "No method"} ·{" "}
                      {formatDate(payment.paid_at ?? payment.created_at)}
                    </CardDescription>
                  </div>
                  <Badge variant={statusVariant(payment.status)}>
                    {payment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-mono text-2xl font-semibold">
                  {formatCurrency(payment.amount)}
                </p>
                <Button asChild variant="outline">
                  <Link href={`/subscriptions/${payment.subscription_id}`}>
                    Open subscription
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptText />
                </EmptyMedia>
                <EmptyTitle>No payments yet</EmptyTitle>
                <EmptyDescription>
                  Payments appear here after checkout.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
