import type * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type TableActionTone =
  | "create"
  | "view"
  | "edit"
  | "schedule"
  | "feedback"
  | "danger"

const toneClassNames: Record<TableActionTone, string> = {
  create:
    "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  view: "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15",
  edit: "border-chart-4/40 bg-chart-4/10 text-chart-4 hover:bg-chart-4/20",
  schedule:
    "border-chart-3/35 bg-chart-3/10 text-chart-3 hover:bg-chart-3/20",
  feedback:
    "border-chart-2/35 bg-chart-2/10 text-chart-2 hover:bg-chart-2/20",
  danger:
    "border-destructive/35 bg-destructive/10 text-destructive hover:bg-destructive/20",
}

type TableActionButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "variant"
> & {
  tone?: TableActionTone
}

export function TableActionButton({
  tone = "view",
  className,
  size = "sm",
  ...props
}: TableActionButtonProps) {
  return (
    <Button
      variant={tone === "create" ? "default" : "outline"}
      size={size}
      className={cn(
        "min-w-20 rounded-full border px-3 font-semibold shadow-none",
        toneClassNames[tone],
        className
      )}
      {...props}
    />
  )
}

export function TableActionIconButton({
  className,
  size = "icon-sm",
  ...props
}: Omit<React.ComponentProps<typeof Button>, "variant">) {
  return (
    <Button
      variant="outline"
      size={size}
      className={cn(
        "rounded-full border-border bg-muted/40 text-muted-foreground shadow-none hover:border-primary/30 hover:bg-primary/10 hover:text-primary",
        className
      )}
      {...props}
    />
  )
}
