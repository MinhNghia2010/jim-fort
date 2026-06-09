"use client"

import { useActionState, useEffect, useRef } from "react"
import { CircleAlert, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type MemberActionState = {
  error?: string
  message?: string
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
  submitName?: string
  submitValue?: string
  actionsClassName?: string
  secondaryAction?: React.ReactNode
  successMessage?: string
}

const initialState: MemberActionState = {}

export function MemberActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving",
  buttonVariant,
  buttonClassName,
  submitName,
  submitValue,
  actionsClassName,
  secondaryAction,
  successMessage = "Action completed",
}: MemberActionFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const wasPending = useRef(false)

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

    toast.success(state.message ?? successMessage)
  }, [pending, state.error, state.message, successMessage])

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {children}
      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className={cn("flex flex-col gap-2", actionsClassName)}>
        <Button
          type="submit"
          disabled={pending}
          variant={buttonVariant}
          className={buttonClassName}
          name={submitName}
          value={submitValue}
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
        {secondaryAction}
      </div>
    </form>
  )
}
