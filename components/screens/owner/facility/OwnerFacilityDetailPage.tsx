import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  Building2,
  CircleAlert,
  CirclePlus,
  Dumbbell,
  MapPin,
  Phone,
  Users,
} from "lucide-react"

import {
  getCreateRoomHref,
  getFacilityDetailPageData,
  getRoomHref,
  type RoomStatus,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
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

interface OwnerFacilityDetailPageProps {
  facilityName: string
  canAddRoom?: boolean
}

const roomStatusLabels: Record<RoomStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  closed: "Closed",
}

export async function OwnerFacilityDetailPage({
  facilityName,
  canAddRoom = false,
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
            <CardAction className="flex items-center gap-2">
              <Badge variant="secondary">{facility.roomCount} rooms</Badge>
              {canAddRoom ? (
                <Button size="sm" asChild>
                  <Link href={getCreateRoomHref(facility.name)}>
                    <CirclePlus data-icon="inline-start" />
                    Add room
                  </Link>
                </Button>
              ) : null}
            </CardAction>
          </CardHeader>
          <CardContent className="p-4">
            {facility.rooms.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {facility.rooms.map((room) => (
                  <Link
                    key={room.id}
                    href={getRoomHref(facility.name, room.id)}
                    aria-label={`Open ${room.name} room details`}
                    className="group rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
                  >
                    <Card className="h-full transition-colors group-hover:border-primary/50 group-hover:bg-muted/30">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MapPin
                            aria-hidden="true"
                            className="size-4 text-muted-foreground"
                          />
                          <span className="min-w-0 break-words">
                            {room.name}
                          </span>
                        </CardTitle>
                        <CardDescription className="break-words">
                          {room.description}
                        </CardDescription>
                        <CardAction>
                          <StatusBadge status={room.status} showDot>
                            {roomStatusLabels[room.status]}
                          </StatusBadge>
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">
                              Equipment
                            </p>
                            <p className="font-heading text-2xl font-semibold tabular-nums">
                              {room.equipmentCount}
                            </p>
                          </div>
                          <div className="rounded-xl bg-muted/40 p-3">
                            <p className="text-xs text-muted-foreground">
                              Issues
                            </p>
                            <p className="font-heading text-2xl font-semibold tabular-nums">
                              {room.issueEquipmentCount}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="justify-between text-sm text-muted-foreground">
                        <span className="flex items-center gap-2">
                          <CircleAlert aria-hidden="true" className="size-4" />
                          Updated {room.updatedAtLabel}
                        </span>
                        <span className="flex items-center gap-1 font-medium text-foreground">
                          Details
                          <ArrowRight
                            aria-hidden="true"
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                          />
                        </span>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Empty className="min-h-64">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <MapPin />
                  </EmptyMedia>
                  <EmptyTitle>No rooms found</EmptyTitle>
                  <EmptyDescription>
                    Room records from the live rooms table will appear here.
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
