import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Activity,
  CircleAlert,
  CirclePlus,
  Dumbbell,
  Wrench,
} from "lucide-react"

import {
  getCreateEquipmentHref,
  getFacilityHref,
  getRoomEquipmentPageData,
  getRoomEquipmentHref,
  type RoomStatus,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { SummaryCard } from "@/components/SummaryCard"
import { OwnerRoomEquipmentTable } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { TableActionButton } from "@/components/TableActionButton"
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

interface OwnerFacilityRoomPageProps {
  facilityName: string
  roomId: string
}

const roomStatusLabels: Record<RoomStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  closed: "Closed",
}

export async function OwnerFacilityRoomPage({
  facilityName,
  roomId,
}: OwnerFacilityRoomPageProps) {
  const data = await getRoomEquipmentPageData(facilityName, roomId)
  const facilityBackHref = getFacilityHref(data.facility?.name ?? facilityName)

  if (!data.room && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room) {
    return (
      <PageShell
        backHref={facilityBackHref}
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

  const { facility, room } = data
  const statusCounts = {
    active: data.equipments.filter((equipment) => equipment.status === "active")
      .length,
    maintenance: data.equipments.filter(
      (equipment) => equipment.status === "maintenance"
    ).length,
    broken: data.equipments.filter((equipment) => equipment.status === "broken")
      .length,
    retired: data.equipments.filter(
      (equipment) => equipment.status === "retired"
    ).length,
  }

  return (
    <PageShell
      backHref={facilityBackHref}
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
        <SummaryCard
          title="Equipment"
          value={room.equipmentCount}
          description="Total equipment in this room"
          icon={Dumbbell}
        />
        <SummaryCard
          title="Active"
          value={statusCounts.active}
          description="Equipment available for use"
          icon={Activity}
        />
        <SummaryCard
          title="Maintenance"
          value={statusCounts.maintenance}
          description="Scheduled preventive work"
          icon={Wrench}
        />
        <SummaryCard
          title="Broken"
          value={statusCounts.broken}
          description={`${statusCounts.retired} retired equipment records`}
          icon={CircleAlert}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Room details</CardTitle>
            <CardDescription>Status and equipment health.</CardDescription>
            <CardAction>
              <StatusBadge status={room.status} showDot>
                {roomStatusLabels[room.status]}
              </StatusBadge>
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
                Open equipment page
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equipment health</CardTitle>
            <CardDescription>
              Current equipment status split for this room.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {statusCounts.active}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Maintenance</p>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {statusCounts.maintenance}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Broken</p>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {statusCounts.broken}
              </p>
            </div>
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Retired</p>
              <p className="font-heading text-2xl font-semibold tabular-nums">
                {statusCounts.retired}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Equipment list</CardTitle>
          <CardDescription>
            Showing {data.equipments.length} equipment records in {room.name}.
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Badge variant="secondary">{data.equipments.length} records</Badge>
            <TableActionButton asChild tone="create">
              <Link href={getCreateEquipmentHref(facility.name, room.id)}>
                <CirclePlus data-icon="inline-start" />
                Add equipment
              </Link>
            </TableActionButton>
          </CardAction>
        </CardHeader>
        <CardContent className="px-0">
          <OwnerRoomEquipmentTable
            equipments={data.equipments}
            facilityName={facility.name}
            roomId={room.id}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
