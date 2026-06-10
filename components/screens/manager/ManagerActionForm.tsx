"use client"

import { useActionState, useEffect, useRef } from "react"
import { CircleAlert, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ActionState = {
  error?: string
}

type ServerAction = (
  state: ActionState,
  formData: FormData
) => Promise<ActionState>

export function ManagerActionForm({
  action,
  children,
  submitLabel,
  pendingLabel = "Saving",
  successMessage = "Action completed",
  secondaryAction,
  actionsClassName,
}: {
  action: ServerAction
  children: React.ReactNode
  submitLabel: string
  pendingLabel?: string
  successMessage?: string
  secondaryAction?: React.ReactNode
  actionsClassName?: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
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

    toast.success(successMessage)
  }, [pending, state.error, successMessage])

  return (
    <form action={formAction} className="grid gap-3">
      {children}
      {state.error ? (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className={cn("flex flex-col gap-2", actionsClassName)}>
        <Button type="submit" disabled={pending}>
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
