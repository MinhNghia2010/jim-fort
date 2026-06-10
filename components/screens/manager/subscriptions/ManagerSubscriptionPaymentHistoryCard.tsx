import { StatusBadge } from "@/components/StatusBadge"
import {
  formatSubscriptionDate,
  formatSubscriptionLabel,
  formatSubscriptionMoney,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { PaymentRow } from "./manager-subscription-detail-data"

type ManagerSubscriptionPaymentHistoryCardProps = {
  payments: PaymentRow[]
  totalPaid: number
}

export function ManagerSubscriptionPaymentHistoryCard({
  payments,
  totalPaid,
}: ManagerSubscriptionPaymentHistoryCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Payment history</CardTitle>
        <CardDescription>
          {payments.length
            ? `${payments.length} payment record${
                payments.length === 1 ? "" : "s"
              }, ${formatSubscriptionMoney(totalPaid)} paid.`
            : "No payment attempts have been recorded."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {payments.length ? (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-4"
            >
              <div>
                <p className="text-xs text-muted-foreground">Amount</p>
                <p className="font-medium">
                  {formatSubscriptionMoney(payment.amount)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={payment.status} showDot />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Method</p>
                <p className="font-medium">
                  {formatSubscriptionLabel(payment.method)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">
                  {formatSubscriptionDate(payment.paid_at ?? payment.created_at)}
                </p>
              </div>
              <div className="sm:col-span-4">
                <p className="text-xs text-muted-foreground">Payment details</p>
                <p className="text-muted-foreground">
                  {payment.payer_name ??
                    payment.cardholder_name ??
                    "No payer name"}
                  {payment.payer_phone ? ` · ${payment.payer_phone}` : ""}
                  {payment.card_last_four
                    ? ` · Card ending ${payment.card_last_four}${
                        payment.card_expiry
                          ? `, expires ${payment.card_expiry}`
                          : ""
                      }`
                    : ""}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">
            Payment attempts will appear here after checkout starts.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
