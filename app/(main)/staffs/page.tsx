import { ManagerStaffPage } from "@/components/screens/manager/staffs/ManagerStaffPage"
import { OwnerStaffPage } from "@/components/screens/owner/staffs/OwnerStaffPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function StaffsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerStaffPage />,
    manager: <ManagerStaffPage />,
  })
}
