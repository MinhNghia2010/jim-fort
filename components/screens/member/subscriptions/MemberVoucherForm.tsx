"use client"

import { useId } from "react"

import { applyVoucher } from "@/app/(main)/member-actions"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type MemberVoucherFormProps = {
  subscriptionId: string
}

export function MemberVoucherForm({ subscriptionId }: MemberVoucherFormProps) {
  const voucherCodeId = useId()

  return (
    <MemberActionForm
      action={applyVoucher}
      submitLabel="Apply voucher"
      pendingLabel="Applying"
      buttonVariant="outline"
      successMessage="Voucher applied"
    >
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={voucherCodeId}>Voucher code</FieldLabel>
          <Input
            id={voucherCodeId}
            name="code"
            autoComplete="off"
            className="uppercase"
          />
        </Field>
      </FieldGroup>
    </MemberActionForm>
  )
}
