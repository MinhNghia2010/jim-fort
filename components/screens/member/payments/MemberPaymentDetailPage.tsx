import Link from "next/link"
import {
  CalendarClock,
  CreditCard,
  DollarSign,
  ReceiptText,
  SearchX,
} from "lucide-react"

import { getPaymentDetailData } from "@/app/(main)/payments/data"
import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import { StatusBadge } from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface MemberPaymentDetailPageProps {
  paymentId: string
  backHref?: string
  viewerLabel?: string
  canOpenSubscription?: boolean
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Not recorded"
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm break-words">{value}</p>
    </div>
  )
}

function PaymentNotFound({
  paymentId,
  backHref = "/payments",
}: MemberPaymentDetailPageProps) {
  return (
    <PageShell
      backHref={backHref}
      title="Payment not found"
      description="This payment is not available from your account."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching payment
          </CardTitle>
          <CardDescription>
            No accessible payment matched{" "}
            <span className="font-mono text-foreground">{paymentId}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={backHref}>Return</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function MemberPaymentDetailPage({
  paymentId,
  backHref = "/payments",
  viewerLabel = "Member",
  canOpenSubscription = true,
}: MemberPaymentDetailPageProps) {
  const payment = await getPaymentDetailData(paymentId)

  if (!payment) {
    return <PaymentNotFound paymentId={paymentId} backHref={backHref} />
  }

  return (
    <PageShell
      backHref={backHref}
      eyebrow={viewerLabel}
      title="Payment detail"
      description="Review the payment amount, method, and linked subscription."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Amount"
          value={currencyFormatter.format(payment.amount)}
          description="Payment total"
          icon={DollarSign}
        />
        <SummaryCard
          title="Status"
          value={payment.status.replaceAll("_", " ")}
          description="Current payment state"
          icon={ReceiptText}
        />
        <SummaryCard
          title="Method"
          value={payment.method?.replaceAll("_", " ") ?? "Not set"}
          description="Recorded payment channel"
          icon={CreditCard}
        />
        <SummaryCard
          title="Paid"
          value={formatDate(payment.paidAt)}
          description="Completion timestamp"
          icon={CalendarClock}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Payment record</CardTitle>
            <CardDescription>
              Created {formatDate(payment.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                label="Amount"
                value={currencyFormatter.format(payment.amount)}
              />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Status
                </p>
                <StatusBadge status={payment.status} showDot />
              </div>
              <DetailRow
                label="Method"
                value={payment.method?.replaceAll("_", " ") ?? "Not set"}
              />
              <DetailRow label="Paid at" value={formatDate(payment.paidAt)} />
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailRow
                label="Payer"
                value={payment.payerName ?? "Not recorded"}
              />
              <DetailRow
                label="Payer phone"
                value={payment.payerPhone ?? "Not recorded"}
              />
              <DetailRow
                label="Cardholder"
                value={payment.cardholderName ?? "Not recorded"}
              />
              <DetailRow
                label="Card"
                value={
                  payment.cardLastFour
                    ? `•••• ${payment.cardLastFour}${
                        payment.cardExpiry ? `, ${payment.cardExpiry}` : ""
                      }`
                    : "Not recorded"
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              Membership connected to this payment.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {payment.subscription ? (
              <>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="text-right font-medium">
                    {payment.subscription.plan}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Facility</span>
                  <span className="text-right">
                    {payment.subscription.facility}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Status</span>
                  <StatusBadge status={payment.subscription.status} showDot />
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Final price</span>
                  <span className="font-medium">
                    {currencyFormatter.format(payment.subscription.finalPrice)}
                  </span>
                </div>
                {canOpenSubscription ? (
                  <Button asChild className="mt-2">
                    <Link href={`/subscriptions/${payment.subscription.id}`}>
                      Open subscription
                    </Link>
                  </Button>
                ) : null}
              </>
            ) : (
              <p className="text-muted-foreground">
                No linked subscription was returned.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
