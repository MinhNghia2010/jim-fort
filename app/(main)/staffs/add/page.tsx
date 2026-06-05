import { ManagerAddStaffPage } from "@/components/screens/manager/staffs/ManagerAddStaffPage"
import { OwnerAddStaffPage } from "@/components/screens/owner/staffs/OwnerAddStaffPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function AddStaffPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerAddStaffPage />,
    manager: <ManagerAddStaffPage />,
  })
}
