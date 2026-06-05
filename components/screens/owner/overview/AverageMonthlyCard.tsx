import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AverageMonthlyMetric } from "@/lib/owner-overview"

interface AverageMonthlyCardProps {
  metrics: readonly AverageMonthlyMetric[]
}

export function AverageMonthlyCard({ metrics }: AverageMonthlyCardProps) {
  return (
    <Card className="bg-primary text-primary-foreground ring-primary/20">
      <CardHeader>
        <CardTitle>Average monthly</CardTitle>
        <CardDescription className="text-primary-foreground/70">
          Five-month operating average
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex flex-col gap-1">
            <p className="text-xs text-primary-foreground/70">{metric.label}</p>
            <p className="font-heading text-xl font-semibold tabular-nums">
              {metric.value}
              {metric.detail && (
                <span className="ml-2 text-xs font-normal text-primary-foreground/60">
                  {metric.detail}
                </span>
              )}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
