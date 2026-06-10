import { ManagerEditStaffPage } from "@/components/screens/manager/staffs/ManagerEditStaffPage"
import { OwnerEditStaffPage } from "@/components/screens/owner/staffs/OwnerEditStaffPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ staffId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { staffId } = await params

  return renderRolePage(role, {
    owner: <OwnerEditStaffPage staffId={staffId} />,
    manager: <ManagerEditStaffPage staffId={staffId} />,
  })
}
