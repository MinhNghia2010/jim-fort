import { notFound } from "next/navigation"

import { createFacilityRoom } from "@/app/(main)/facility/actions"
import {
  getFacilityDetailPageData,
  getFacilityHref,
} from "@/app/(main)/facility/data"
import { PageShell } from "@/components/PageShell"
import { OwnerCreateRoomForm } from "@/components/screens/owner/facility/OwnerCreateRoomForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OwnerCreateRoomPageProps {
  facilityName: string
}

export async function OwnerCreateRoomPage({
  facilityName,
}: OwnerCreateRoomPageProps) {
  const data = await getFacilityDetailPageData(facilityName)
  const backHref = getFacilityHref(data.facility?.name ?? facilityName)

  if (!data.facility && !data.errorMessage) {
    notFound()
  }

  if (!data.facility) {
    return (
      <PageShell
        backHref={backHref}
        backLabel="Back to facility"
        eyebrow="Facility"
        title="Room cannot be created"
        description="The selected facility could not be loaded."
      >
        <Alert variant="destructive">
          <AlertTitle>Facility data could not be loaded</AlertTitle>
          <AlertDescription>
            {data.errorMessage ?? "The selected facility was not found."}
          </AlertDescription>
        </Alert>
      </PageShell>
    )
  }

  return (
    <OwnerCreateRoomForm
      action={createFacilityRoom}
      facility={{
        id: data.facility.id,
        name: data.facility.name,
      }}
      backHref={backHref}
    />
  )
}
