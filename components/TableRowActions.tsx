"use client"

import Link from "next/link"
import { useState, type ReactNode } from "react"
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react"

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
  description: string
  inputName: string
  inputValue: string
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
                <Trash2 />
                Delete
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {deleteAction ? (
        <DeleteConfirmationDialog
          action={deleteAction.action}
          description={deleteAction.description}
          inputName={deleteAction.inputName}
          inputValue={deleteAction.inputValue}
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          successMessage={deleteAction.successMessage}
          title={deleteAction.title}
        />
      ) : null}
    </>
  )
}
