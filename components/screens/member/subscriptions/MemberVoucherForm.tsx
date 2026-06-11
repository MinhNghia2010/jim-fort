"use client"

import { useId, useState } from "react"
import { TicketPercent } from "lucide-react"

import { applyVoucher } from "@/app/(main)/member-actions"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Label } from "@/components/ui/label"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

type MemberVoucherFormProps = {
  subscriptionId: string
}

export function MemberVoucherForm({ subscriptionId }: MemberVoucherFormProps) {
  const codeId = useId()
  const [code, setCode] = useState("")

  return (
    <MemberActionForm
      action={applyVoucher}
      submitLabel="Apply voucher"
      pendingLabel="Applying"
      buttonVariant="secondary"
      successMessage="Voucher applied"
    >
      <input type="hidden" name="subscriptionId" value={subscriptionId} />
      <div className="grid gap-2">
        <Label htmlFor={codeId}>Voucher code</Label>
        <InputGroup>
          <InputGroupAddon>
            <TicketPercent aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            id={codeId}
            name="code"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.toUpperCase().replace(/\s/g, ""))
            }
            autoCapitalize="characters"
            autoComplete="off"
            className="font-mono uppercase"
            maxLength={48}
            required
          />
        </InputGroup>
      </div>
    </MemberActionForm>
  )
}
