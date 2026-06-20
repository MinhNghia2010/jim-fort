"use client"

import { MemberPaymentForm } from "@/components/screens/member/subscriptions/MemberPaymentForm"
import { MemberPaymentSummaryCard } from "@/components/screens/member/subscriptions/MemberPaymentSummaryCard"
import { MemberVoucherForm } from "@/components/screens/member/subscriptions/MemberVoucherForm"
import { formatSubscriptionMoney } from "@/lib/features/shared/subscriptions/detail-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { MemberSubscriptionRow } from "@/lib/features/member/subscriptions/detail-data"

type MemberSubscriptionCheckoutSectionProps = {
  subscription: MemberSubscriptionRow
}

export function MemberSubscriptionCheckoutSection({
  subscription,
}: MemberSubscriptionCheckoutSectionProps) {
  const discountAmount = Number(subscription.discount_amount) || 0

  return (
    <MemberPaymentForm
      subscriptionId={subscription.id}
      subscriptionLabel={
        subscription.membership_packages?.name ?? "this subscription"
      }
      amountLabel={formatSubscriptionMoney(subscription.final_price)}
    >
      {({ actions, form }) => (
        <>
          <div className="grid content-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>
                  Successful payment activates the subscription.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                {discountAmount <= 0 ? (
                  <>
                    <MemberVoucherForm subscriptionId={subscription.id} />
                    <Separator />
                  </>
                ) : null}
                {form}
              </CardContent>
            </Card>
          </div>

          <div className="grid content-start gap-4">
            <MemberPaymentSummaryCard
              actions={actions}
              subscription={subscription}
            />
          </div>
        </>
      )}
    </MemberPaymentForm>
  )
}
