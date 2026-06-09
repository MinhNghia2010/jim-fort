import type { FacilityDistributionItem } from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

interface SegmentedProgressBarProps {
  items: readonly FacilityDistributionItem[]
}

export function SegmentedProgressBar({ items }: SegmentedProgressBarProps) {
  if (items.length === 0) {
    return (
      <div className="flex w-full items-center justify-center rounded-lg border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
        No membership access data yet
      </div>
    )
  }

  return (
    <div className="flex w-full overflow-hidden rounded-lg border bg-muted/40">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex min-w-0 items-center justify-between gap-3 border-r px-3 py-3 last:border-r-0"
          style={{ flexBasis: 0, flexGrow: item.percentage }}
        >
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-md text-[10px] font-semibold text-primary-foreground",
                item.colorClass
              )}
            >
              {item.code}
            </span>
            <span className="truncate text-xs font-medium">{item.label}</span>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {item.percentage}%
          </span>
        </div>
      ))}
    </div>
  )
}
