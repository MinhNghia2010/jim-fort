<<<<<<< HEAD
import { RoutePlaceholder } from "@/components/RoutePlaceholder"

export function OwnerRoomEquipmentPage() {
  return <RoutePlaceholder title="Owner Room Equipment" />
=======
import Link from "next/link"
import {
  Activity,
  Dumbbell,
  SearchX,
  TriangleAlert,
  Wrench,
} from "lucide-react"

import {
  getOwnerRoomEquipmentPageData,
  type EquipmentStatusSummary,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerRoomEquipmentTable } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
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
import type { EquipmentStatus } from "@/lib/owner-overview"

interface OwnerRoomEquipmentPageProps {
  facilityName?: string
  roomId?: string
  category?: string
}

function getStatusCount(
  counts: readonly EquipmentStatusSummary[],
  status: EquipmentStatus
) {
  return counts.find((item) => item.status === status)?.count ?? 0
}

function EquipmentNotFoundContent({ backHref }: { backHref: string }) {
  return (
    <PageShell
      backHref={backHref}
      backLabel="Back to facility"
      title="Equipment not found"
      description="The requested room or equipment group could not be found."
    >
      <Empty className="min-h-80 border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>No matching equipment</EmptyTitle>
          <EmptyDescription>
            Return to the facility page and choose an available equipment group.
          </EmptyDescription>
        </EmptyHeader>
        <Button asChild>
          <Link href={backHref}>Back to facility</Link>
        </Button>
      </Empty>
    </PageShell>
  )
}

export async function OwnerRoomEquipmentPage({
  facilityName,
  roomId,
  category,
}: OwnerRoomEquipmentPageProps) {
  const data = await getOwnerRoomEquipmentPageData({
    facilityName,
    roomId,
    category,
  })
  const facilityHref = data.facility
    ? `/facility/${encodeURIComponent(data.facility.name)}`
    : "/facility"

  if (!data.facility || !data.room) {
    return <EquipmentNotFoundContent backHref={facilityHref} />
  }

  const activeCount = getStatusCount(data.statusCounts, "active")
  const maintenanceCount = getStatusCount(data.statusCounts, "maintenance")
  const brokenCount = getStatusCount(data.statusCounts, "broken")
  const retiredCount = getStatusCount(data.statusCounts, "retired")

  return (
    <PageShell
      backHref={facilityHref}
      backLabel="Back to facility"
      eyebrow={`${data.facility.name} / ${data.room.name}`}
      title={data.title}
      description={data.description}
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Equipment data could not be fully loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Machines"
          value={data.machines.length}
          detail="Individual equipment records"
          icon={Dumbbell}
        />
        <ManagementMetricCard
          title="Active"
          value={activeCount}
          detail="Ready for member use"
          icon={Activity}
        />
        <ManagementMetricCard
          title="Maintenance"
          value={maintenanceCount}
          detail="Scheduled or in service"
          icon={Wrench}
        />
        <ManagementMetricCard
          title="Unavailable"
          value={brokenCount + retiredCount}
          detail={`${brokenCount} broken, ${retiredCount} retired`}
          icon={TriangleAlert}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Machine list</CardTitle>
          <CardDescription>
            Each physical machine in this equipment group.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <OwnerRoomEquipmentTable machines={data.machines} />
        </CardContent>
      </Card>
    </PageShell>
  )
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
}
