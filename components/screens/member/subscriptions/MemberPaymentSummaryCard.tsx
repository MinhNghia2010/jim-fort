import { StatusBadge } from "@/components/StatusBadge"
import { SubscriptionSummaryRow } from "@/components/screens/shared/subscriptions/SubscriptionInfoRows"
import { formatSubscriptionMoney } from "@/lib/features/shared/subscriptions/detail-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberSubscriptionRow } from "@/lib/features/member/subscriptions/detail-data"

type MemberPaymentSummaryCardProps = {
  subscription: MemberSubscriptionRow
  actions?: React.ReactNode
}

export function MemberPaymentSummaryCard({
  actions,
  subscription,
}: MemberPaymentSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment summary</CardTitle>
        <CardDescription>
          {subscription.gym_facilities?.name ?? "Jim Fort"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        <SubscriptionSummaryRow
          label="Plan"
          value={subscription.membership_packages?.name ?? "Membership"}
        />
        <SubscriptionSummaryRow label="Status">
          <StatusBadge status={subscription.status} showDot />
        </SubscriptionSummaryRow>
        <SubscriptionSummaryRow
          label="Base"
          value={formatSubscriptionMoney(subscription.base_price)}
        />
        <SubscriptionSummaryRow
          label="Discount"
          value={formatSubscriptionMoney(subscription.discount_amount)}
        />
        <div className="flex items-center justify-between gap-4 border-t pt-3 text-base">
          <span className="font-medium">Total</span>
          <span className="font-semibold">
            {formatSubscriptionMoney(subscription.final_price)}
          </span>
        </div>
      </CardContent>
      {actions ? <CardFooter className="block">{actions}</CardFooter> : null}
    </Card>
  )
}
