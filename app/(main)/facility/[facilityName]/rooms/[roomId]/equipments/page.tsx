import { ManagerRoomEquipmentPage } from "@/components/screens/manager/facility/ManagerRoomEquipmentPage"
import { OwnerRoomEquipmentPage } from "@/components/screens/owner/facility/OwnerRoomEquipmentPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface FacilityRoomEquipmentPageProps {
  params: Promise<{
    facilityName: string
    roomId: string
  }>
}

export default async function FacilityRoomEquipmentPage({
  params,
}: FacilityRoomEquipmentPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName, roomId } = await params

  return renderRolePage(role, {
    owner: (
      <OwnerRoomEquipmentPage
        facilityName={facilityName}
        roomId={roomId}
        canAddEquipment={true}
      />
    ),
    manager: (
      <ManagerRoomEquipmentPage facilityName={facilityName} roomId={roomId} />
    ),
  })
}
