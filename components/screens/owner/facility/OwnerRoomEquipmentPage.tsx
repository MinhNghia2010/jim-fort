import { notFound } from "next/navigation"
import Link from "next/link"
import { CirclePlus, Dumbbell } from "lucide-react"

import {
  getCreateEquipmentHref,
  getRoomEquipmentPageData,
  getRoomHref,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { OwnerRoomEquipmentTable } from "@/components/screens/owner/facility/OwnerRoomEquipmentTable"
import { TableActionButton } from "@/components/TableActionButton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface OwnerRoomEquipmentPageProps {
  facilityName: string
  roomId: string
}

export async function OwnerRoomEquipmentPage({
  facilityName,
  roomId,
}: OwnerRoomEquipmentPageProps) {
  const data = await getRoomEquipmentPageData(facilityName, roomId)

  if (!data.room && !data.errorMessage) {
    notFound()
  }

  const facilityNameLabel = data.facility?.name ?? "Facility"
  const roomName = data.room?.name ?? "Room"
  const roomBackHref = getRoomHref(data.facility?.name ?? facilityName, roomId)

  return (
    <PageShell
      backHref={roomBackHref}
      eyebrow={facilityNameLabel}
      title={`${roomName} equipment`}
      description="Review room machines, status, identifiers, purchase details, and notes."
    >
      {data.errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Equipment could not be loaded</AlertTitle>
          <AlertDescription>{data.errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell
              aria-hidden="true"
              className="size-5 text-muted-foreground"
            />
            Room equipment
          </CardTitle>
          <CardDescription>
            Showing {data.equipments.length} equipment records for {roomName}.
          </CardDescription>
          {data.facility && data.room ? (
            <CardAction>
              <TableActionButton asChild tone="create">
                <Link
                  href={getCreateEquipmentHref(
                    data.facility.name,
                    data.room.id
                  )}
                >
                  <CirclePlus data-icon="inline-start" />
                  Add equipment
                </Link>
              </TableActionButton>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="px-0">
          <OwnerRoomEquipmentTable
            equipments={data.equipments}
            facilityName={data.facility?.name}
            roomId={data.room?.id}
          />
        </CardContent>
      </Card>
    </PageShell>
  )
}
