import { ManagerStaffDetailPage } from "@/components/screens/manager/staffs/ManagerStaffDetailPage"
import { OwnerStaffDetailPage } from "@/components/screens/owner/staffs/OwnerStaffDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { staffId } = await params

  return renderRolePage(role, {
    owner: <OwnerStaffDetailPage staffId={staffId} />,
    manager: <ManagerStaffDetailPage staffId={staffId} />,
  })
}
