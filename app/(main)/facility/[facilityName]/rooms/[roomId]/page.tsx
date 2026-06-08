import { ManagerFacilityRoomPage } from "@/components/screens/manager/facility/ManagerFacilityRoomPage"
import { OwnerFacilityRoomPage } from "@/components/screens/owner/facility/OwnerFacilityRoomPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface FacilityRoomPageProps {
  params: Promise<{
    facilityName: string
    roomId: string
  }>
}

export default async function FacilityRoomPage({
  params,
}: FacilityRoomPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName, roomId } = await params

  return renderRolePage(role, {
    owner: (
      <OwnerFacilityRoomPage facilityName={facilityName} roomId={roomId} />
    ),
    manager: (
      <ManagerFacilityRoomPage facilityName={facilityName} roomId={roomId} />
    ),
  })
}
