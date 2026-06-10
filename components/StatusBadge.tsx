import type { ComponentProps, ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StatusTone = "success" | "warning" | "danger" | "neutral" | "info"

interface StatusBadgeProps extends Omit<
  ComponentProps<typeof Badge>,
  "children"
> {
  status: string | null | undefined
  children?: ReactNode
  showDot?: boolean
}

const statusToneMap: Record<string, StatusTone> = {
  active: "success",
  accepted: "success",
  approved: "success",
  available: "success",
  completed: "success",
  paid: "success",
  responded: "success",
  success: "success",

  in_review: "info",
  in_progress: "info",
  redeemed: "info",
  rescheduled: "info",
  scheduled: "info",

  maintenance: "warning",
  "not sent": "warning",
  on_leave: "warning",
  open: "warning",
  pending: "warning",
  pending_member_decision: "warning",
  pending_payment: "warning",
  pending_pt_setup: "warning",

  broken: "danger",
  cancelled: "danger",
  canceled: "danger",
  failed: "danger",
  missed: "danger",
  rejected: "danger",
  terminated: "danger",

  archived: "neutral",
  closed: "neutral",
  disabled: "neutral",
  inactive: "neutral",
  read: "neutral",
  refunded: "neutral",
  retired: "neutral",
  unknown: "neutral",

  expired: "danger",
}

function normalizeStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() || "unknown"
}

function getStatusTone(status: string | null | undefined): StatusTone {
  return statusToneMap[normalizeStatus(status)] ?? "neutral"
}

function formatStatusLabel(status: string | null | undefined) {
  return normalizeStatus(status)
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => (word === "pt" ? "PT" : word))
    .map((word) =>
      word === "PT" ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

function toneClassName(tone: StatusTone) {
  return cn(
    "gap-1.5 rounded-md border px-2.5 py-1 font-medium",
    tone === "success" &&
      "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
    tone === "warning" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
    tone === "danger" &&
      "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
    tone === "neutral" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground",
    tone === "info" && "border-primary/30 bg-primary/10 text-primary"
  )
}

function dotClassName(tone: StatusTone) {
  return cn(
    "size-1.5 rounded-full",
    tone === "success" && "bg-chart-2",
    tone === "warning" && "bg-chart-4",
    tone === "danger" && "bg-destructive",
    tone === "neutral" && "bg-muted-foreground",
    tone === "info" && "bg-primary"
  )
}

export function StatusBadge({
  status,
  children,
  className,
  showDot = false,
  variant = "outline",
  ...props
}: StatusBadgeProps) {
  const tone = getStatusTone(status)

  return (
    <Badge
      variant={variant}
      className={cn(toneClassName(tone), className)}
      {...props}
    >
      {showDot ? (
        <span className={dotClassName(tone)} aria-hidden="true" />
      ) : null}
      {children ?? formatStatusLabel(status)}
    </Badge>
  )
}
