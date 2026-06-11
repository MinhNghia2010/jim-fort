"use client"

import { useActionState, useEffect, useId, useRef } from "react"
import { CircleAlert, Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { checkoutSubscription } from "@/app/(main)/member-actions"
import { MemberPaymentFields } from "@/components/screens/member/subscriptions/MemberPaymentForm"
import { MemberPaymentSummaryCard } from "@/components/screens/member/subscriptions/MemberPaymentSummaryCard"
import { MemberVoucherForm } from "@/components/screens/member/subscriptions/MemberVoucherForm"
import {
  formatSubscriptionMoney,
} from "@/lib/features/shared/subscriptions/detail-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberSubscriptionRow } from "@/lib/features/member/subscriptions/detail-data"

type MemberActionState = {
  error?: string
  message?: string
}

type MemberSubscriptionCheckoutCardProps = {
  subscription: MemberSubscriptionRow
}

const initialState: MemberActionState = {}

export function MemberSubscriptionCheckoutCard({
  subscription,
}: MemberSubscriptionCheckoutCardProps) {
  const [state, formAction, pending] = useActionState(
    checkoutSubscription,
    initialState
  )
  const paymentFormId = useId()
  const wasPending = useRef(false)
  const hasAppliedDiscount = Number(subscription.discount_amount) > 0
  const amountLabel = formatSubscriptionMoney(subscription.final_price)

  useEffect(() => {
    if (pending) {
      wasPending.current = true
      return
    }

    if (!wasPending.current) {
      return
    }

    wasPending.current = false

    if (state.error) {
      toast.error(state.error)
      return
    }

    toast.success(state.message ?? "Payment completed")
  }, [pending, state.error, state.message])

  const checkoutActions = (
    <div className="grid gap-3">
      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <Button
          type="submit"
          form={paymentFormId}
          name="intent"
          value="pay"
          disabled={pending}
          className="w-full"
        >
          {pending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Processing
            </>
          ) : (
            `Pay ${amountLabel}`
          )}
        </Button>
        <Button
          type="submit"
          form={paymentFormId}
          name="intent"
          value="cancel"
          variant="outline"
          formNoValidate
          disabled={pending}
          className="px-3"
        >
          <X data-icon="inline-start" />
          Cancel
        </Button>
      </div>
    </div>
  )

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card>
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            Successful payment activates the subscription.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {hasAppliedDiscount ? (
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="font-medium">Voucher discount applied</p>
              <p className="mt-1 text-muted-foreground">
                The payment total has already been reduced for this
                subscription.
              </p>
            </div>
          ) : (
            <MemberVoucherForm subscriptionId={subscription.id} />
          )}
          <form id={paymentFormId} action={formAction} className="grid gap-3">
            <input type="hidden" name="subscriptionId" value={subscription.id} />
            <MemberPaymentFields amountLabel={amountLabel} />
          </form>
        </CardContent>
      </Card>
      <div className="grid content-start gap-4">
        <MemberPaymentSummaryCard
          subscription={subscription}
          actions={checkoutActions}
        />
      </div>
    </div>
  )
}
