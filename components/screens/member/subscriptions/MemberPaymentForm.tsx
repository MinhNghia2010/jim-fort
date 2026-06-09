"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { useFormStatus } from "react-dom"
import { CreditCard, Landmark, X } from "lucide-react"

import { checkoutSubscription } from "@/app/(main)/member-actions"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect } from "@/components/ui/native-select"

type PaymentMethod = "card" | "bank_transfer"

type MemberPaymentFormProps = {
  subscriptionId: string
  amountLabel: string
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
]

function CancelCheckoutButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
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
  amountLabel,
}: MemberPaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("card")
  const methodId = useId()
  const cardholderNameId = useId()
  const cardNumberId = useId()
  const cardExpiryId = useId()
  const cardCvvId = useId()

  return (
    <MemberActionForm
      action={checkoutSubscription}
      submitLabel={`Pay ${amountLabel}`}
      pendingLabel="Processing"
      submitName="intent"
      submitValue="pay"
      actionsClassName="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
      buttonClassName="w-full"
      secondaryAction={<CancelCheckoutButton />}
      successMessage="Payment completed"
    >
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <div className="grid gap-2">
        <Label htmlFor={methodId}>Payment method</Label>
        <NativeSelect
          id={methodId}
          name="method"
          className="w-full"
          value={method}
          onChange={(event) => setMethod(event.target.value as PaymentMethod)}
        >
          {paymentMethods.map((paymentMethod) => (
            <option key={paymentMethod.value} value={paymentMethod.value}>
              {paymentMethod.label}
            </option>
          ))}
        </NativeSelect>
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
    </MemberActionForm>
  )
}
