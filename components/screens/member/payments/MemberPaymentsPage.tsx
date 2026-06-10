import { ReceiptText } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import {
  MemberPaymentsTable,
  type MemberPaymentTableRow,
} from "@/components/screens/member/payments/MemberPaymentsTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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

export async function MemberPaymentsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_payments")
    .select("id,amount,method,status,paid_at,created_at,subscription_id")
    .order("created_at", { ascending: false })

  const payments = (data ?? []) as unknown as MemberPaymentTableRow[]

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
        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Payment history</CardTitle>
            <CardDescription>
              Showing {payments.length} membership payment records.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <MemberPaymentsTable payments={payments} />
          </CardContent>
        </Card>
      ) : (
        <Empty className="min-h-80 border">
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
      )}
    </PageShell>
  )
}
