"use client"

import { useState } from "react"
import { Trash2, X } from "lucide-react"

import {
  DeleteConfirmationDialog,
  type DeleteConfirmationDialogProps,
} from "@/components/DeleteConfirmationDialog"
import { Button } from "@/components/ui/button"

type DeleteConfirmationButtonProps = Omit<
  DeleteConfirmationDialogProps,
  "open" | "onOpenChange"
> & {
  className?: React.ComponentProps<typeof Button>["className"]
  disabled?: React.ComponentProps<typeof Button>["disabled"]
  label?: string
  size?: React.ComponentProps<typeof Button>["size"]
}

export function DeleteConfirmationButton({
  className,
  disabled,
  label = "Delete",
  size = "sm",
  ...dialogProps
}: DeleteConfirmationButtonProps) {
  const [open, setOpen] = useState(false)
  const TriggerIcon = label.toLowerCase().startsWith("cancel") ? X : Trash2

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <TriggerIcon data-icon="inline-start" />
        {label}
      </Button>
      <DeleteConfirmationDialog
        {...dialogProps}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
