import { ManagerMemberDetailPage } from "@/components/screens/manager/members/ManagerMemberDetailPage"
import { OwnerMemberDetailPage } from "@/components/screens/owner/members/OwnerMemberDetailPage"
import { PtMemberDetailPage } from "@/components/screens/pt/members/PtMemberDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MemberDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerMemberDetailPage />,
    manager: <ManagerMemberDetailPage />,
    pt: <PtMemberDetailPage />,
  })
}
