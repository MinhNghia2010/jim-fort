import type { LucideIcon } from "lucide-react"

import { SummaryCard } from "@/components/SummaryCard"

type ScheduleMetric = {
  description: string
  icon: LucideIcon
  title: string
  value: number
}

type ScheduleMetricGridProps = {
  metrics: ScheduleMetric[]
}

export function ScheduleMetricGrid({ metrics }: ScheduleMetricGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <SummaryCard
          key={metric.title}
          title={metric.title}
          description={metric.description}
          value={metric.value}
          icon={metric.icon}
        />
      ))}
    </div>
  )
}
