"use client"

import { useTransition, type FormEvent } from "react"
import { Trash2, TriangleAlert, X } from "lucide-react"
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
  confirmLabel?: string
  description: string
  inputName: string
  inputValue: string
  onDeleteSuccess?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  onOptimisticDelete?: () => void
  successMessage: string
  title: string
}

export function DeleteConfirmationDialog({
  action,
  confirmLabel = "Delete",
  description,
  inputName,
  inputValue,
  onDeleteSuccess,
  open,
  onOpenChange,
  onOptimisticDelete,
  successMessage,
  title,
}: DeleteConfirmationDialogProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const ConfirmIcon = confirmLabel.toLowerCase().startsWith("cancel")
    ? X
    : Trash2

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    onOpenChange(false)
    startTransition(async () => {
      onOptimisticDelete?.()

      try {
        const result = await action({}, formData)

        if (result.error) {
          toast.error(result.error)
          return
        }

        onDeleteSuccess?.()
        toast(result.message ?? successMessage, {
          className: "cn-toast-delete",
          icon: <ConfirmIcon className="size-3.5" />,
          style: {
            background: "var(--toast-error-bg)",
            borderColor: "var(--toast-error-border)",
            color: "var(--toast-error-text)",
          },
        })
        router.refresh()
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Unable to complete this action."
        )
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <form onSubmit={handleSubmit}>
            <input type="hidden" name={inputName} value={inputValue} />
            <Button type="submit" variant="destructive" disabled={pending}>
              <ConfirmIcon data-icon="inline-start" />
              {confirmLabel}
            </Button>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
