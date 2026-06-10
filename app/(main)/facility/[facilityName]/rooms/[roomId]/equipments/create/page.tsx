import { OwnerCreateEquipmentPage } from "@/components/screens/owner/facility/OwnerCreateEquipmentPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface CreateRoomEquipmentPageProps {
  params: Promise<{
    facilityName: string
    roomId: string
  }>
}

export default async function CreateRoomEquipmentPage({
  params,
}: CreateRoomEquipmentPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName, roomId } = await params

  return renderRolePage(role, {
    owner: (
      <OwnerCreateEquipmentPage
        facilityName={facilityName}
        roomId={roomId}
      />
    ),
  })
}
