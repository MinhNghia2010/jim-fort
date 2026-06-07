<<<<<<< HEAD
import { RoutePlaceholder } from "@/components/RoutePlaceholder"

export function OwnerFacilityDetailPage() {
  return <RoutePlaceholder title="Owner Facility Detail" />
=======
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Building2,
  Dumbbell,
  SearchX,
  TriangleAlert,
  Wrench,
} from "lucide-react"

import {
  getOwnerFacilityPageData,
  type EquipmentStatusSummary,
  type FacilityEquipmentGroup,
  type FacilityRoomSummary,
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
  CardFooter,
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
import type { EquipmentStatus } from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

interface OwnerFacilityDetailPageProps {
  facilityName?: string
}

const equipmentStatusClassNames: Record<EquipmentStatus, string> = {
  active:
    "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
  maintenance:
    "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
  broken:
    "border-destructive/30 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
  retired: "border-muted-foreground/30 bg-muted text-muted-foreground",
}

const roomStatusClassNames: Record<RoomStatus, string> = {
  active:
    "border-chart-2/30 bg-chart-2/10 text-chart-2 dark:border-chart-2/40 dark:bg-chart-2/20",
  maintenance:
    "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:border-chart-4/40 dark:bg-chart-4/20 dark:text-chart-4",
  closed:
    "border-muted-foreground/30 bg-muted text-muted-foreground",
}

function getStatusCount(
  counts: readonly EquipmentStatusSummary[],
  status: EquipmentStatus
) {
  return counts.find((item) => item.status === status)?.count ?? 0
}

function StatusBadge({
  status,
  label,
}: {
  status: EquipmentStatus
  label: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", equipmentStatusClassNames[status])}
    >
      {label}
    </Badge>
  )
}

function RoomStatusBadge({
  status,
  label,
}: {
  status: RoomStatus
  label: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border font-medium", roomStatusClassNames[status])}
    >
      {label}
    </Badge>
  )
}

function EquipmentStatusCounts({
  counts,
}: {
  counts: readonly EquipmentStatusSummary[]
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {counts.map((item) => (
        <div
          key={item.status}
          className="flex items-center justify-between gap-2 rounded-md border bg-background px-3 py-2"
        >
          <StatusBadge status={item.status} label={item.label} />
          <span className="font-mono text-sm font-medium tabular-nums">
            {item.count}
          </span>
        </div>
      ))}
    </div>
  )
}

function EquipmentGroupCard({
  facilityHref,
  roomId,
  group,
}: {
  facilityHref: string
  roomId: string
  group: FacilityEquipmentGroup
}) {
  const equipmentHref = `${facilityHref}/rooms/${roomId}/equipments?category=${encodeURIComponent(group.category)}`

  return (
    <Card size="sm" className="h-full">
      <CardHeader>
        <CardTitle>{group.name}</CardTitle>
        <CardDescription>{group.description}</CardDescription>
        <CardAction>
          <Badge variant="secondary">{group.count} machines</Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2 text-xs sm:grid-cols-2">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Brand</span>
            <span className="font-medium">{group.brandLabel}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">Model</span>
            <span className="font-medium">{group.modelLabel}</span>
          </div>
        </div>

        <EquipmentStatusCounts counts={group.statusCounts} />
      </CardContent>
      <CardFooter className="mt-auto justify-end">
        <Button variant="ghost" size="sm" asChild>
          <Link href={equipmentHref}>
            View machines
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

function RoomSection({
  facilityHref,
  room,
}: {
  facilityHref: string
  room: FacilityRoomSummary
}) {
  return (
    <section className="flex flex-col gap-4 border-t pt-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-heading text-xl font-semibold tracking-tight">
              {room.name}
            </h2>
            <RoomStatusBadge status={room.status} label={room.statusLabel} />
          </div>
          <p className="text-sm text-muted-foreground">
            {room.equipmentCount.toLocaleString("en-US")} assigned machines
            across {room.equipmentGroups.length.toLocaleString("en-US")}{" "}
            equipment groups.
          </p>
        </div>

        <div className="grid min-w-64 gap-2 sm:grid-cols-2">
          {room.statusCounts.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span className="text-muted-foreground">{item.label}</span>
              <span className="font-mono font-medium tabular-nums">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {room.equipmentGroups.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {room.equipmentGroups.map((group) => (
            <EquipmentGroupCard
              key={group.category}
              facilityHref={facilityHref}
              roomId={room.id}
              group={group}
            />
          ))}
        </div>
      ) : (
        <Empty className="min-h-40 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>No equipment assigned</EmptyTitle>
            <EmptyDescription>
              Equipment groups will appear here once this room has machines.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  )
}

function FacilityEmptyState() {
  return (
    <PageShell
      title="Facility"
      description="Facility rooms and equipment status will appear here once a facility is available."
    >
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No facility found</EmptyTitle>
          <EmptyDescription>
            The current account does not have an owner facility available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </PageShell>
  )
}

export async function OwnerFacilityDetailPage({
  facilityName,
}: OwnerFacilityDetailPageProps) {
  const data = await getOwnerFacilityPageData(facilityName)

  if (!data.facility) {
    return <FacilityEmptyState />
  }

  const facilityHref = `/facility/${encodeURIComponent(data.facility.name)}`
  const activeCount = getStatusCount(data.totalStatusCounts, "active")
  const maintenanceCount = getStatusCount(
    data.totalStatusCounts,
    "maintenance"
  )
  const brokenCount = getStatusCount(data.totalStatusCounts, "broken")

  return (
    <PageShell
      eyebrow={data.facility.name}
      title="Facility"
      description="Room-by-room equipment status, grouped by machine type."
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Facility data could not be fully loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Rooms"
          value={data.rooms.length}
          detail="Facility rooms"
          icon={Building2}
        />
        <ManagementMetricCard
          title="Equipment"
          value={data.totalEquipmentCount}
          detail={`${data.assignedEquipmentCount} in rooms, ${data.facilityLevelEquipmentCount} facility-wide`}
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Active"
          value={activeCount}
          detail="Machines ready for members"
          icon={Activity}
        />
        <ManagementMetricCard
          title="Needs attention"
          value={maintenanceCount + brokenCount}
          detail={`${maintenanceCount} maintenance, ${brokenCount} broken`}
          icon={TriangleAlert}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment status</CardTitle>
          <CardDescription>
            Current machine counts across the selected facility.
          </CardDescription>
          <CardAction className="text-muted-foreground">
            <Wrench aria-hidden="true" className="size-4" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <EquipmentStatusCounts counts={data.totalStatusCounts} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-8">
        {data.rooms.length ? (
          data.rooms.map((room) => (
            <RoomSection
              key={room.id}
              facilityHref={facilityHref}
              room={room}
            />
          ))
        ) : (
          <Empty className="min-h-80 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Building2 />
              </EmptyMedia>
              <EmptyTitle>No rooms found</EmptyTitle>
              <EmptyDescription>
                Rooms will appear here once they are added to this facility.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </PageShell>
  )
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
}
