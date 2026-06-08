import Link from "next/link"
import { notFound } from "next/navigation"
import { Building2, Dumbbell, MapPin, Phone, Users } from "lucide-react"

import {
  getFacilityDetailPageData,
  getRoomEquipmentHref,
  getRoomHref,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

interface OwnerFacilityDetailPageProps {
  facilityName: string
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

export async function OwnerFacilityDetailPage({
  facilityName,
}: OwnerFacilityDetailPageProps) {
  const data = await getFacilityDetailPageData(facilityName)

  if (!data.facility && !data.errorMessage) {
    notFound()
  }

  const facility = data.facility

  if (!facility) {
    return (
      <PageShell
        eyebrow="Facility"
        title="Facility not available"
        description="The requested facility could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Facility data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The requested facility was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  return (
    <PageShell
      eyebrow="Facility"
      title={facility.name}
      description={facility.description}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Facility data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Rooms"
          value={facility.roomCount}
          detail="Configured facility rooms"
          icon={MapPin}
        />
        <ManagementMetricCard
          title="Equipment"
          value={facility.equipmentCount}
          detail={`${facility.activeEquipmentCount} active equipment records`}
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Active staff"
          value={facility.activeStaffCount}
          detail="Staff currently active"
          icon={Users}
        />
        <ManagementMetricCard
          title="Members"
          value={facility.activeMemberCount}
          detail="Active membership subscriptions"
          icon={Building2}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Facility details</CardTitle>
            <CardDescription>Location and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <MapPin
                aria-hidden="true"
                className="mt-1 size-4 text-muted-foreground"
              />
              <div>
                <p className="text-sm font-medium">Address</p>
                <p className="text-sm text-muted-foreground">
                  {facility.address}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone
                aria-hidden="true"
                className="mt-1 size-4 text-muted-foreground"
              />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">
                  {facility.phone}
                </p>
              </div>
            </div>
            <div className="grid gap-3 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{facility.createdAtLabel}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-medium">{facility.updatedAtLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-4">
            <CardTitle>Rooms</CardTitle>
            <CardDescription>
              Showing {facility.rooms.length} rooms in this facility.
            </CardDescription>
            <CardAction>
              <Badge variant="secondary">{facility.roomCount} rooms</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            <Table className="min-w-[820px] table-fixed text-[0.925rem] [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <colgroup>
                <col className="w-[16rem]" />
                <col className="w-[10rem]" />
                <col className="w-[10rem]" />
                <col className="w-[11rem]" />
                <col className="w-[13rem]" />
              </colgroup>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead className="h-12 pl-6">Room</TableHead>
                  <TableHead className="h-12">Status</TableHead>
                  <TableHead className="h-12">Equipment</TableHead>
                  <TableHead className="h-12">Issues</TableHead>
                  <TableHead className="h-12 pr-6 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facility.rooms.length ? (
                  facility.rooms.map((room) => (
                    <TableRow key={room.id} className="h-[4.5rem]">
                      <TableCell className="pl-6">
                        <div>
                          <p className="leading-5 font-semibold break-words">
                            {room.name}
                          </p>
                          <p className="text-xs break-words text-muted-foreground">
                            Updated {room.updatedAtLabel}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={roomStatusClassName(room.status)}
                        >
                          {roomStatusLabels[room.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono font-medium tabular-nums">
                        {room.equipmentCount}
                      </TableCell>
                      <TableCell className="font-mono font-medium tabular-nums">
                        {room.issueEquipmentCount}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="outline" size="sm">
                            <Link href={getRoomHref(facility.name, room.id)}>
                              Room
                            </Link>
                          </Button>
                          <Button asChild size="sm">
                            <Link
                              href={getRoomEquipmentHref(
                                facility.name,
                                room.id
                              )}
                            >
                              Equipment
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-64">
                      <Empty>
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <MapPin />
                          </EmptyMedia>
                          <EmptyTitle>No rooms found</EmptyTitle>
                          <EmptyDescription>
                            Room records from the live rooms table will appear
                            here.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
