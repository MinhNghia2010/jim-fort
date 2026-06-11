"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { Eye, MoreHorizontal, Pencil, Trash2, X } from "lucide-react"

import {
  DeleteConfirmationDialog,
  type DeleteServerAction,
} from "@/components/DeleteConfirmationDialog"
import { TableActionIconButton } from "@/components/TableActionButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type TableRowAction = {
  href: string
  label: string
}

export type TableRowDeleteAction = {
  action: DeleteServerAction
  label?: string
  confirmLabel?: string
  description: string
  inputName: string
  inputValue: string
  onDeleteSuccess?: () => void
  onOptimisticDelete?: () => void
  successMessage: string
  title: string
}

interface TableRowActionsProps {
  label: string
  actions?: readonly TableRowAction[]
  children?: ReactNode
  deleteAction?: TableRowDeleteAction
}

function getActionPresentation(label: string) {
  const normalizedLabel = label.trim().toLowerCase()

  if (normalizedLabel.startsWith("view")) {
    return { icon: Eye, label: "View" }
  }

  if (normalizedLabel.startsWith("edit")) {
    return { icon: Pencil, label: "Edit" }
  }

  return { icon: null, label }
}

export function TableRowActions({
  label,
  actions,
  children,
  deleteAction,
}: TableRowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const deleteActionLabel = deleteAction?.label ?? "Delete"
  const DeleteActionIcon = deleteActionLabel.toLowerCase().startsWith("cancel")
    ? X
    : Trash2

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TableActionIconButton aria-label={label}>
            <MoreHorizontal />
          </TableActionIconButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            {children ??
              actions?.map((action) => {
                const presentation = getActionPresentation(action.label)
                const ActionIcon = presentation.icon

                return (
                  <DropdownMenuItem asChild key={action.href}>
                    <Link href={action.href}>
                      {ActionIcon ? <ActionIcon /> : null}
                      {presentation.label}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            {deleteAction ? (
              <DropdownMenuItem
                variant="destructive"
                className="text-destructive! focus:text-destructive! [&_svg]:text-destructive!"
                onSelect={() => setDeleteOpen(true)}
              >
                <DeleteActionIcon />
                {deleteActionLabel}
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {deleteAction ? (
        <DeleteConfirmationDialog
          action={deleteAction.action}
          confirmLabel={deleteAction.confirmLabel}
          description={deleteAction.description}
          inputName={deleteAction.inputName}
          inputValue={deleteAction.inputValue}
          onDeleteSuccess={deleteAction.onDeleteSuccess}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onOptimisticDelete={deleteAction.onOptimisticDelete}
          successMessage={deleteAction.successMessage}
          title={deleteAction.title}
        />
      ) : null}
    </>
  )
}
