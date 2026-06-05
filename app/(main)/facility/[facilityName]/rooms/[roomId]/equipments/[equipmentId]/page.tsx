import { ManagerEquipmentDetailPage } from "@/components/screens/manager/facility/ManagerEquipmentDetailPage"
import { OwnerEquipmentDetailPage } from "@/components/screens/owner/facility/OwnerEquipmentDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function EquipmentDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerEquipmentDetailPage />,
    manager: <ManagerEquipmentDetailPage />,
  })
}
