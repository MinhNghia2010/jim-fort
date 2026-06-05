"use client"

import { Cell, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export interface MembershipDistributionItem {
  name: string
  value: number
  color: string
}

interface MembershipDistributionChartProps {
  data: readonly MembershipDistributionItem[]
}

const chartConfig = {
  value: {
    label: "Active members",
  },
} satisfies ChartConfig

export function MembershipDistributionChart({
  data,
}: MembershipDistributionChartProps) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-square size-32 shrink-0"
    >
      <PieChart accessibilityLayer>
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideLabel nameKey="name" />}
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={36}
          outerRadius={56}
          strokeWidth={2}
        >
          {data.map((item) => (
            <Cell key={item.name} fill={item.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
