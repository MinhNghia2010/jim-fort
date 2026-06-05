import { ManagerProfilePage } from "@/components/screens/manager/profile/ManagerProfilePage"
import { MemberProfilePage } from "@/components/screens/member/profile/MemberProfilePage"
import { OwnerProfilePage } from "@/components/screens/owner/profile/OwnerProfilePage"
import { PtProfilePage } from "@/components/screens/pt/profile/PtProfilePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function ProfilePage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerProfilePage />,
    manager: <ManagerProfilePage />,
    pt: <PtProfilePage />,
    member: <MemberProfilePage />,
  })
}
