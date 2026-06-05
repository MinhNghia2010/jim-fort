import { ManagerCreateMemberPage } from "@/components/screens/manager/members/ManagerCreateMemberPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function CreateMemberPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    manager: <ManagerCreateMemberPage />,
  })
}
