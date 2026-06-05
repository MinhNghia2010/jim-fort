import { TrendingDown, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { currencyFormatter } from "@/lib/owner-overview"

interface RevenueOverviewProps {
  title?: string
  totalRevenue: number
  previousRevenue: number
  revenueChange: number
  growth?: number
  periodLabel: string
}

export function RevenueOverview({
  title,
  totalRevenue,
  previousRevenue,
  revenueChange,
  growth,
  periodLabel,
}: RevenueOverviewProps) {
  const GrowthIcon =
    growth !== undefined && growth < 0 ? TrendingDown : TrendingUp

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {title ? (
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-muted-foreground sm:text-4xl">
          {title}
        </h1>
      ) : null}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Total Gym Revenue</p>
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-heading text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
            {currencyFormatter.format(totalRevenue)}
          </p>
          {growth !== undefined && (
            <Badge variant={growth < 0 ? "destructive" : "default"}>
              <GrowthIcon data-icon="inline-start" />
              {Math.abs(growth)}%
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary">
            {currencyFormatter.format(Math.abs(revenueChange))}
          </Badge>
          <span>
            vs previous {currencyFormatter.format(previousRevenue)} ·{" "}
            {periodLabel}
          </span>
        </div>
      </div>
    </div>
  )
}
