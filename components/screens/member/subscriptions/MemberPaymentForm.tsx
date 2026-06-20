"use client"

import Image from "next/image"
import { useActionState, useEffect, useId, useRef, useState } from "react"
import { CircleAlert, CreditCard, Landmark, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
  cancelPendingSubscriptionFromTable,
  checkoutSubscription,
} from "@/app/(main)/member-actions"
import { DeleteConfirmationButton } from "@/components/DeleteConfirmationButton"
import { FormSelect } from "@/components/FormSelect"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaymentMethod = "card" | "bank_transfer"

type MemberActionState = {
  error?: string
  message?: string
}

type MemberPaymentFormProps = {
  subscriptionId: string
  subscriptionLabel: string
  amountLabel: string
  children?: (props: {
    actions: React.ReactNode
    form: React.ReactNode
  }) => React.ReactNode
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
]

function PaymentActionButtons({
  amountLabel,
  formId,
  pending,
  subscriptionId,
  subscriptionLabel,
}: {
  amountLabel: string
  formId: string
  pending: boolean
  subscriptionId: string
  subscriptionLabel: string
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
      <Button
        form={formId}
        type="submit"
        disabled={pending}
        name="intent"
        value="pay"
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
      <DeleteConfirmationButton
        action={cancelPendingSubscriptionFromTable}
        className="px-3"
        confirmLabel="Cancel subscription"
        description={`Cancel ${subscriptionLabel}? This keeps the subscription record in your history, but removes it from pending checkout.`}
        disabled={pending}
        inputName="subscriptionId"
        inputValue={subscriptionId}
        label="Cancel"
        size="default"
        successMessage="Subscription cancelled"
        title="Cancel subscription?"
      />
    </div>
  )
}

function BankTransferQrPanel({ amountLabel }: { amountLabel: string }) {
  return (
    <div className="grid gap-4 rounded-lg border bg-muted/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
          <Landmark
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
        </div>
        <div className="min-w-0">
          <p className="font-medium">Bank transfer</p>
          <p className="text-sm text-muted-foreground">
            Techcombank · 9091 1701 368 · {amountLabel}
          </p>
        </div>
      </div>
      <div className="mx-auto w-full max-w-64 overflow-hidden rounded-lg border bg-background">
        <Image
          src="/image.png"
          alt="Techcombank bank transfer QR code"
          width={745}
          height={826}
          className="h-auto w-full"
        />
      </div>
    </div>
  )
}

export function MemberPaymentForm({
  subscriptionId,
  subscriptionLabel,
  amountLabel,
  children,
}: MemberPaymentFormProps) {
  const [state, formAction, pending] = useActionState(
    checkoutSubscription,
    {} as MemberActionState
  )
  const wasPending = useRef(false)
  const [method, setMethod] = useState<PaymentMethod>("card")
  const formId = useId()
  const methodId = useId()
  const cardholderNameId = useId()
  const cardNumberId = useId()
  const cardExpiryId = useId()
  const cardCvvId = useId()

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

  const form = (
    <form id={formId} action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <div className="grid gap-2">
        <Label htmlFor={methodId}>Payment method</Label>
        <FormSelect
          id={methodId}
          name="method"
          options={paymentMethods}
          value={method}
          onValueChange={(value) => setMethod(value as PaymentMethod)}
        />
      </div>

      {method === "card" ? (
        <div className="grid gap-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <CreditCard aria-hidden="true" className="size-4" />
            Card information
          </div>
          <div className="grid gap-2">
            <Label htmlFor={cardholderNameId}>Cardholder name</Label>
            <Input
              id={cardholderNameId}
              name="cardholderName"
              autoComplete="cc-name"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={cardNumberId}>Card number</Label>
            <Input
              id={cardNumberId}
              name="cardNumber"
              inputMode="numeric"
              autoComplete="cc-number"
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={cardExpiryId}>Expiry date</Label>
              <Input
                id={cardExpiryId}
                name="cardExpiry"
                placeholder="MM/YY"
                autoComplete="cc-exp"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={cardCvvId}>CVC</Label>
              <Input
                id={cardCvvId}
                name="cardCvv"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                maxLength={4}
                required
              />
            </div>
          </div>
        </div>
      ) : null}

      {method === "bank_transfer" ? (
        <BankTransferQrPanel amountLabel={amountLabel} />
      ) : null}

      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
    </form>
  )

  const actions = (
    <PaymentActionButtons
      amountLabel={amountLabel}
      formId={formId}
      pending={pending}
      subscriptionId={subscriptionId}
      subscriptionLabel={subscriptionLabel}
    />
  )

  if (children) {
    return <>{children({ actions, form })}</>
  }

  return (
    <>
      {form}
      {actions}
    </>
  )
}
