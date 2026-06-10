"use client"

import { useActionState, useEffect, useRef } from "react"
import { Loader2, Trash2, TriangleAlert } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export type DeleteActionState = {
  error?: string
  message?: string
}

export type DeleteServerAction = (
  state: DeleteActionState,
  formData: FormData
) => Promise<DeleteActionState>

export type DeleteConfirmationDialogProps = {
  action: DeleteServerAction
  description: string
  inputName: string
  inputValue: string
  open: boolean
  onOpenChange: (open: boolean) => void
  successMessage: string
  title: string
}

export function DeleteConfirmationDialog({
  action,
  description,
  inputName,
  inputValue,
  open,
  onOpenChange,
  successMessage,
  title,
}: DeleteConfirmationDialogProps) {
  const router = useRouter()
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

    toast.success(state.message ?? successMessage)
    onOpenChange(false)
    router.refresh()
  }, [
    onOpenChange,
    pending,
    router,
    state.error,
    state.message,
    successMessage,
  ])

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) {
          onOpenChange(nextOpen)
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <form action={formAction}>
            <input type="hidden" name={inputName} value={inputValue} />
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Deleting
                </>
              ) : (
                <>
                  <Trash2 data-icon="inline-start" />
                  Delete
                </>
              )}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
