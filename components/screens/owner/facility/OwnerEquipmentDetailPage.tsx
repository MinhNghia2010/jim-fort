import { notFound } from "next/navigation"
import {
  BadgeDollarSign,
  Barcode,
  CalendarDays,
  Dumbbell,
  Hash,
} from "lucide-react"

import { getEquipmentDetailPageData } from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import type { RoomEquipmentStatus } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface OwnerEquipmentDetailPageProps {
  facilityName: string
  roomId: string
  equipmentId: string
}

const statusLabels: Record<RoomEquipmentStatus, string> = {
  active: "Active",
  maintenance: "Maintenance",
  broken: "Broken",
  retired: "Retired",
}

function statusClassName(status: RoomEquipmentStatus) {
  return cn(
    "border font-medium",
    status === "active" && "border-chart-2/30 bg-chart-2/10 text-chart-2",
    status === "maintenance" &&
      "border-chart-4/40 bg-chart-4/20 text-chart-5 dark:text-chart-4",
    status === "broken" &&
      "border-destructive/30 bg-destructive/10 text-destructive",
    status === "retired" &&
      "border-muted-foreground/30 bg-muted text-muted-foreground"
  )
}

export async function OwnerEquipmentDetailPage({
  facilityName,
  roomId,
  equipmentId,
}: OwnerEquipmentDetailPageProps) {
  const data = await getEquipmentDetailPageData(
    facilityName,
    roomId,
    equipmentId
  )

  if (!data.equipment && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room || !data.equipment) {
    return (
      <PageShell
        eyebrow="Equipment"
        title="Equipment not available"
        description="The requested equipment record could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Equipment data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The requested equipment was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  const { facility, room, equipment } = data

  return (
    <PageShell
      eyebrow={`${facility.name} / ${room.name}`}
      title={equipment.name}
      description={equipment.description}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Equipment data could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Status"
          value={statusLabels[equipment.status]}
          detail="Current equipment lifecycle"
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Purchase cost"
          value={equipment.costLabel}
          detail="Recorded purchase price"
          icon={BadgeDollarSign}
        />
        <ManagementMetricCard
          title="Purchased"
          value={equipment.purchasedAtLabel}
          detail="Purchase date"
          icon={CalendarDays}
        />
        <ManagementMetricCard
          title="Code"
          value={equipment.code}
          detail="Facility equipment identifier"
          icon={Barcode}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Equipment details</CardTitle>
            <CardDescription>
              Identifiers, category, and status.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={statusClassName(equipment.status)}
              >
                {statusLabels[equipment.status]}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <p className="text-sm font-medium">{equipment.category}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Brand</p>
              <p className="text-sm font-medium">{equipment.brand}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Model</p>
              <p className="text-sm font-medium">{equipment.model}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Serial</p>
              <p className="font-mono text-sm font-medium">
                {equipment.serial}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Equipment code</p>
              <p className="font-mono text-sm font-medium">{equipment.code}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash
                aria-hidden="true"
                className="size-4 text-muted-foreground"
              />
              Notes and audit
            </CardTitle>
            <CardDescription>Maintenance note and timestamps.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-xl bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">Note</p>
              <p className="text-sm">{equipment.note ?? "No note recorded."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {equipment.createdAtLabel}
                </p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-xs text-muted-foreground">Updated</p>
                <p className="text-sm font-medium">
                  {equipment.updatedAtLabel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}
