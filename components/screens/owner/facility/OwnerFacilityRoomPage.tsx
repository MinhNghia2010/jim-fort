import Link from "next/link"
import { notFound } from "next/navigation"
import { Activity, Archive, CircleAlert, Dumbbell, Wrench } from "lucide-react"

import {
  getFacilityRoomPageData,
  getRoomEquipmentHref,
  type RoomStatus,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

interface OwnerFacilityRoomPageProps {
  facilityName: string
  roomId: string
}

const roomStatusLabels: Record<RoomStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  closed: "Closed",
}

function roomStatusClassName(status: RoomStatus) {
  return cn(
    "border font-medium",
    status === "active" && "border-chart-2/30 bg-chart-2/10 text-chart-2",
    status === "maintenance" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:text-chart-4",
    status === "closed" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground"
  )
}

export async function OwnerFacilityRoomPage({
  facilityName,
  roomId,
}: OwnerFacilityRoomPageProps) {
  const data = await getFacilityRoomPageData(facilityName, roomId)

  if (!data.room && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room) {
    return (
      <PageShell
        eyebrow="Facility room"
        title="Room not available"
        description="The requested room could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Room data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The requested room was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  const { facility, room, statusCounts } = data

  return (
    <PageShell
      eyebrow={facility.name}
      title={room.name}
      description={room.description}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Room data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Equipment"
          value={room.equipmentCount}
          detail="Total equipment in this room"
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Active"
          value={statusCounts.active}
          detail="Equipment available for use"
          icon={Activity}
        />
        <ManagementMetricCard
          title="Maintenance"
          value={statusCounts.maintenance}
          detail="Scheduled preventive work"
          icon={Wrench}
        />
        <ManagementMetricCard
          title="Broken"
          value={statusCounts.broken}
          detail={`${statusCounts.retired} retired equipment records`}
          icon={CircleAlert}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Room details</CardTitle>
            <CardDescription>Status and equipment health.</CardDescription>
            <CardAction>
              <Badge
                variant="outline"
                className={roomStatusClassName(room.status)}
              >
                {roomStatusLabels[room.status]}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">
                  Active equipment
                </p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {room.activeEquipmentCount}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Issue equipment</p>
                <p className="font-heading text-2xl font-semibold tabular-nums">
                  {room.issueEquipmentCount}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Last updated</p>
              <p className="text-sm font-medium">{room.updatedAtLabel}</p>
            </div>
            <Button asChild>
              <Link href={getRoomEquipmentHref(facility.name, room.id)}>
                View equipment
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment preview</CardTitle>
            <CardDescription>
              First {data.equipmentPreview.length} equipment records in this
              room.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.equipmentPreview.length ? (
              <div className="flex flex-col gap-3">
                {data.equipmentPreview.map((equipment) => (
                  <div
                    key={equipment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium break-words">
                        {equipment.name}
                      </p>
                      <p className="text-xs break-words text-muted-foreground">
                        {equipment.brand} {equipment.model}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {equipment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <Empty className="min-h-48">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Archive />
                  </EmptyMedia>
                  <EmptyTitle>No equipment found</EmptyTitle>
                  <EmptyDescription>
                    Equipment assigned to this room will appear here.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
