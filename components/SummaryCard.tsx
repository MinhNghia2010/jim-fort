import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface SummaryCardProps {
  title: string
  description: string
  icon: LucideIcon
  value: string | number
  growth?: number
  growthLabel?: string
  variant?: "default" | "emphasis"
  className?: string
}

export function SummaryCard({
  title,
  description,
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
      className={cn(
        "min-w-0",
        isEmphasis && "bg-foreground text-background ring-foreground/10",
        className
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle
            className={cn(
              isEmphasis ? "text-background" : "text-card-foreground"
            )}
          >
            {title}
          </CardTitle>
          <CardDescription
            className={cn(
              isEmphasis ? "text-background/60" : "text-muted-foreground"
            )}
          >
            {description}
          </CardDescription>
        </div>
        <Icon
          aria-hidden="true"
          className={cn(
            "size-5 shrink-0",
            isEmphasis ? "text-background/60" : "text-muted-foreground"
          )}
        />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
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
