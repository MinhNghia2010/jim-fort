"use client"

import { useActionState } from "react"
import { CircleAlert, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

type MemberActionState = {
  error?: string
}

type MemberAction = (
  state: MemberActionState,
  formData: FormData
) => Promise<MemberActionState>

interface MemberActionFormProps {
  action: MemberAction
  children: React.ReactNode
  submitLabel: string
  pendingLabel?: string
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
  buttonClassName?: string
}

const initialState: MemberActionState = {}

export function MemberActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving",
  buttonVariant,
  buttonClassName,
}: MemberActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {children}
      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        variant={buttonVariant}
        className={buttonClassName}
      >
        {pending ? (
          <>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            {pendingLabel}
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
