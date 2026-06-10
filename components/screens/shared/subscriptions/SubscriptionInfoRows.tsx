import type { ReactNode } from "react"

type SubscriptionDetailRowProps = {
  children?: ReactNode
  label: string
  value?: string
}

export function SubscriptionDetailRow({
  children,
  label,
  value,
}: SubscriptionDetailRowProps) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {children ?? <p className="text-sm break-words">{value}</p>}
    </div>
  )
}

type SubscriptionSummaryRowProps = {
  children?: ReactNode
  label: string
  value?: string
}

export function SubscriptionSummaryRow({
  children,
  label,
  value,
}: SubscriptionSummaryRowProps) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children ?? <span className="text-right font-medium">{value}</span>}
    </div>
  )
}
