import { ManagerEditProfilePage } from "@/components/screens/manager/profile/ManagerEditProfilePage"
import { MemberEditProfilePage } from "@/components/screens/member/profile/MemberEditProfilePage"
import { OwnerEditProfilePage } from "@/components/screens/owner/profile/OwnerEditProfilePage"
import { PtEditProfilePage } from "@/components/screens/pt/profile/PtEditProfilePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function EditProfilePage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerEditProfilePage />,
    manager: <ManagerEditProfilePage />,
    pt: <PtEditProfilePage />,
    member: <MemberEditProfilePage />,
  })
}
