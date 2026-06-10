"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { MonthlyMetric } from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

export interface FiveMonthBarChartProps {
  title: string
  data: readonly MonthlyMetric[]
  description?: string
  metricLabel?: string
  valueFormat?: "number" | "currency"
  currency?: string
  detailsHref?: string
  className?: string
}

const CHART_MARGIN = { top: 8, right: 8, left: 8, bottom: 0 } as const

function formatCompactValue(
  value: number,
  valueFormat: "number" | "currency",
  currency: string
) {
  const formatter = new Intl.NumberFormat("en-US", {
    compactDisplay: "short",
    maximumFractionDigits: 1,
    notation: "compact",
    ...(valueFormat === "currency"
      ? {
          currency,
          style: "currency",
        }
      : {}),
  })

  return formatter.format(value)
}

export function FiveMonthBarChart({
  title,
  data,
  description = "Last 5 months",
  metricLabel = title,
  valueFormat = "number",
  currency = "USD",
  detailsHref,
  className,
}: FiveMonthBarChartProps) {
  const chartConfig = {
    value: {
      label: metricLabel,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  const chartData = [...data]
    .sort((first, second) => first.monthKey.localeCompare(second.monthKey))
    .slice(-5)
  const formatValue = (value: number) =>
    valueFormat === "currency"
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency,
          maximumFractionDigits: 0,
        }).format(value)
      : value.toLocaleString("en-US")

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {detailsHref && (
          <CardAction>
            <Button variant="outline" size="sm" asChild>
              <Link href={detailsHref}>
                Details
                <ChevronRight data-icon="inline-end" />
              </Link>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[220px] w-full"
        >
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={CHART_MARGIN}
            barSize={24}
          >
            <CartesianGrid vertical={false} />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                formatCompactValue(Number(value), valueFormat, currency)
              }
            />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(month) => String(month).slice(0, 3)}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="line"
                  formatter={(value) => (
                    <div className="flex w-full min-w-32 items-center justify-between gap-4">
                      <span className="text-muted-foreground">
                        {metricLabel}
                      </span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatValue(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Bar
              dataKey="value"
              fill="var(--color-value)"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
