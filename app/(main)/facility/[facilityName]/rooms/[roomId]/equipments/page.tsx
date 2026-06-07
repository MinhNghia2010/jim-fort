import { ManagerRoomEquipmentPage } from "@/components/screens/manager/facility/ManagerRoomEquipmentPage"
import { OwnerRoomEquipmentPage } from "@/components/screens/owner/facility/OwnerRoomEquipmentPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FacilityRoomEquipmentPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerRoomEquipmentPage />,
    manager: <ManagerRoomEquipmentPage />,
  })
}
