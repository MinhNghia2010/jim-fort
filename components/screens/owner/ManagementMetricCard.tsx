import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface ManagementMetricCardProps {
  title: string
  value: string | number
  detail: string
  icon: LucideIcon
}

export function ManagementMetricCard({
  title,
  value,
  detail,
  icon: Icon,
}: ManagementMetricCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-xs font-normal text-muted-foreground">
          {title}
        </CardTitle>
        <CardAction className="text-muted-foreground">
          <Icon aria-hidden="true" className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}
