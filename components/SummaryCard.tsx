import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  icon: LucideIcon
  value: string | number
  growth?: number
  growthLabel?: string
  variant?: "default" | "emphasis"
  className?: string
}

export function SummaryCard({
  title,
  icon: Icon,
  value,
  growth,
  growthLabel = "vs previous month",
  variant = "default",
  className,
}: SummaryCardProps) {
  const isEmphasis = variant === "emphasis"
  const GrowthIcon =
    growth !== undefined && growth < 0 ? TrendingDown : TrendingUp

  return (
    <Card
      size="sm"
      className={cn(
        "min-w-0",
        isEmphasis && "bg-foreground text-background ring-foreground/10",
        className
      )}
    >
      <CardHeader>
        <CardTitle
          className={cn(
            "text-xs font-normal",
            isEmphasis ? "text-background/60" : "text-muted-foreground"
          )}
        >
          {title}
        </CardTitle>
        <CardAction
          className={cn(
            isEmphasis ? "text-background/60" : "text-muted-foreground"
          )}
        >
          <Icon aria-hidden="true" className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
          {value}
        </p>
        {growth !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 text-xs",
              isEmphasis ? "text-background/70" : "text-muted-foreground"
            )}
          >
            <GrowthIcon aria-hidden="true" className="size-3.5" />
            <span>
              {Math.abs(growth)}% {growthLabel}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
