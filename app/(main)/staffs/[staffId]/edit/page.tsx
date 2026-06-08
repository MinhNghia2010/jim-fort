import { ManagerEditStaffPage } from "@/components/screens/manager/staffs/ManagerEditStaffPage"
import { OwnerEditStaffPage } from "@/components/screens/owner/staffs/OwnerEditStaffPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function EditStaffPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerEditStaffPage />,
    manager: <ManagerEditStaffPage />,
  })
}
