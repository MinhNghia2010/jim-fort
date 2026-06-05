import { ManagerStaffDetailPage } from "@/components/screens/manager/staffs/ManagerStaffDetailPage"
import { OwnerStaffDetailPage } from "@/components/screens/owner/staffs/OwnerStaffDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function StaffDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerStaffDetailPage />,
    manager: <ManagerStaffDetailPage />,
  })
}
