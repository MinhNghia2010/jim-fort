import Link from "next/link"

import { StatusBadge } from "@/components/StatusBadge"
import { TableActionButton } from "@/components/TableActionButton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { EquipmentStatus } from "@/lib/owner-overview"

import { formatPercent } from "./manager-overview-utils"

type EquipmentStatusCount = {
  count: number
  status: EquipmentStatus
}

type ManagerFacilityHealthCardProps = {
  activeStaffCount: number
  equipmentCounts: EquipmentStatusCount[]
  equipmentTotal: number
  facilityCount: number
  roomCount: number
}

export function ManagerFacilityHealthCard({
  activeStaffCount,
  equipmentCounts,
  equipmentTotal,
  facilityCount,
  roomCount,
}: ManagerFacilityHealthCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Facility health</CardTitle>
        <CardDescription>
          Coverage and equipment status across managed facilities.
        </CardDescription>
        <CardAction>
          <TableActionButton asChild tone="view">
            <Link href="/facility">Details</Link>
          </TableActionButton>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
          <FacilityHealthStat label="Facilities" value={facilityCount} />
          <FacilityHealthStat label="Rooms" value={roomCount} />
          <FacilityHealthStat label="Active staff" value={activeStaffCount} />
        </div>

        <div className="flex flex-col gap-5 py-2">
          {equipmentCounts.map((equipment) => (
            <div
              key={equipment.status}
              className="grid grid-cols-[minmax(9rem,auto)_minmax(0,1fr)_3rem] items-center gap-6"
            >
              <StatusBadge status={equipment.status} showDot />
              <Progress
                value={formatPercent(equipment.count, equipmentTotal)}
                aria-label={`${equipment.status} equipment share`}
              />
              <span className="text-right font-mono text-sm text-muted-foreground tabular-nums">
                {equipment.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

type FacilityHealthStatProps = {
  label: string
  value: number
}

function FacilityHealthStat({ label, value }: FacilityHealthStatProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-heading text-2xl font-semibold tabular-nums">
        {value}
      </p>
    </div>
  )
}
