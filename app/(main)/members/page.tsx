import { ManagerMembersPage } from "@/components/screens/manager/members/ManagerMembersPage"
import { OwnerMembersPage } from "@/components/screens/owner/members/OwnerMembersPage"
import { PtMembersPage } from "@/components/screens/pt/members/PtMembersPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MembersPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerMembersPage />,
    manager: <ManagerMembersPage />,
    pt: <PtMembersPage />,
  })
}
