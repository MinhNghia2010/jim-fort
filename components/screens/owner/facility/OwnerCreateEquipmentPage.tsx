import { notFound } from "next/navigation"

import { createRoomEquipment } from "@/app/(main)/facility/actions"
import {
  getFacilityRoomPageData,
  getRoomHref,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { OwnerCreateEquipmentForm } from "@/components/screens/owner/facility/OwnerCreateEquipmentForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OwnerCreateEquipmentPageProps {
  facilityName: string
  roomId: string
}

export async function OwnerCreateEquipmentPage({
  facilityName,
  roomId,
}: OwnerCreateEquipmentPageProps) {
  const data = await getFacilityRoomPageData(facilityName, roomId)
  const backHref = getRoomHref(data.facility?.name ?? facilityName, roomId)

  if (!data.room && !data.errorMessage) {
    notFound()
  }

  if (!data.facility || !data.room) {
    return (
      <PageShell
        backHref={backHref}
        backLabel="Back to room"
        eyebrow="Facility equipment"
        title="Equipment cannot be created"
        description="The selected facility room could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Room data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The selected room was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  return (
    <OwnerCreateEquipmentForm
      action={createRoomEquipment}
      facility={{
        id: data.facility.id,
        name: data.facility.name,
      }}
      room={{
        id: data.room.id,
        name: data.room.name,
      }}
      backHref={backHref}
    />
  )
}
