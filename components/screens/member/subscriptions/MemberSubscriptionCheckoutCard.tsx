import { MemberPaymentForm } from "@/components/screens/member/subscriptions/MemberPaymentForm"
import {
  formatSubscriptionMoney,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberSubscriptionRow } from "./member-subscription-detail-data"

type MemberSubscriptionCheckoutCardProps = {
  subscription: MemberSubscriptionRow
}

export function MemberSubscriptionCheckoutCard({
  subscription,
}: MemberSubscriptionCheckoutCardProps) {
  return (
    <div className="grid content-start gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Successful payment activates the subscription.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberPaymentForm
            subscriptionId={subscription.id}
            amountLabel={formatSubscriptionMoney(subscription.final_price)}
          />
        </CardContent>
      </Card>
    </div>
  )
}
