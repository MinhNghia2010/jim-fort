"use client"

import Image from "next/image"
import { useId, useState } from "react"
import { CreditCard, Landmark } from "lucide-react"

import { FormSelect } from "@/components/FormSelect"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type PaymentMethod = "card" | "bank_transfer"

type MemberPaymentFormProps = {
  amountLabel: string
}

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
]

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

export function MemberPaymentFields({ amountLabel }: MemberPaymentFormProps) {
  const [method, setMethod] = useState<PaymentMethod>("card")
  const methodId = useId()
  const cardholderNameId = useId()
  const cardNumberId = useId()
  const cardExpiryId = useId()
  const cardCvvId = useId()

  return (
    <>
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
    </>
  )
}
