import { ManagerEquipmentDetailPage } from "@/components/screens/manager/facility/ManagerEquipmentDetailPage"
import { OwnerEquipmentDetailPage } from "@/components/screens/owner/facility/OwnerEquipmentDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface EquipmentDetailPageProps {
  params: Promise<{
    facilityName: string
    roomId: string
    equipmentId: string
  }>
}

export default async function EquipmentDetailPage({
  params,
}: EquipmentDetailPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName, roomId, equipmentId } = await params

  return renderRolePage(role, {
    owner: (
      <OwnerEquipmentDetailPage
        facilityName={facilityName}
        roomId={roomId}
        equipmentId={equipmentId}
      />
    ),
    manager: (
      <ManagerEquipmentDetailPage
        facilityName={facilityName}
        roomId={roomId}
        equipmentId={equipmentId}
      />
    ),
  })
}
