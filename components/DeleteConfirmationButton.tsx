"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"

import {
  DeleteConfirmationDialog,
  type DeleteConfirmationDialogProps,
} from "@/components/DeleteConfirmationDialog"
import { Button } from "@/components/ui/button"

type DeleteConfirmationButtonProps = Omit<
  DeleteConfirmationDialogProps,
  "open" | "onOpenChange"
> & {
  label?: string
  size?: React.ComponentProps<typeof Button>["size"]
}

export function DeleteConfirmationButton({
  label = "Delete",
  size = "sm",
  ...dialogProps
}: DeleteConfirmationButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="destructive"
        size={size}
        onClick={() => setOpen(true)}
      >
        <Trash2 data-icon="inline-start" />
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
