import { Dumbbell } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import type {
  EquipmentStatus,
  EquipmentStatusCount,
} from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

interface EquipmentOverviewCardProps {
  rooms: readonly string[]
  statusCounts: readonly EquipmentStatusCount[]
}

const equipmentStatusConfig: Record<
  EquipmentStatus,
  { label: string; colorClass: string }
> = {
  active: { label: "Active", colorClass: "bg-chart-1" },
  maintenance: { label: "Maintenance", colorClass: "bg-chart-4" },
  broken: { label: "Broken", colorClass: "bg-chart-3" },
  retired: { label: "Retired", colorClass: "bg-chart-5" },
}

function getPercentage(count: number, total: number) {
  if (!total) {
    return 0
  }

  return Math.round((count / total) * 1000) / 10
}

export function EquipmentOverviewCard({
  rooms,
  statusCounts,
}: EquipmentOverviewCardProps) {
  const total = statusCounts.reduce((sum, item) => sum + item.count, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gym equipment</CardTitle>
        <CardDescription>Status across facility rooms</CardDescription>
        <CardAction className="text-primary">
          <Dumbbell aria-hidden="true" className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {rooms.map((room) => (
            <Item key={room} variant="muted" size="sm">
              <ItemContent>
                <ItemTitle className="w-full justify-center text-center">
                  {room}
                </ItemTitle>
              </ItemContent>
            </Item>
          ))}
        </div>
        <ItemGroup className="gap-1">
          {statusCounts.map(({ status, count }) => {
            const config = equipmentStatusConfig[status]
            const percentage = getPercentage(count, total)

            return (
              <Item key={status} size="xs">
                <ItemMedia>
                  <span
                    className={cn("size-2 rounded-full", config.colorClass)}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle className="font-normal">{config.label}</ItemTitle>
                </ItemContent>
                <ItemActions className="text-xs text-muted-foreground tabular-nums">
                  {percentage}%
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </CardContent>
      <CardFooter className="mt-auto justify-between">
        <span className="text-xs text-muted-foreground">Total equipment</span>
        <span className="font-heading font-semibold tabular-nums">
          {total.toLocaleString("en-US")}
        </span>
      </CardFooter>
    </Card>
  )
}
