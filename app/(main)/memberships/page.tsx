import { ManagerMembershipsPage } from "@/components/screens/manager/memberships/ManagerMembershipsPage"
import { MemberMembershipsPage } from "@/components/screens/member/memberships/MemberMembershipsPage"
import { OwnerMembershipsPage } from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MembershipsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerMembershipsPage />,
    manager: <ManagerMembershipsPage />,
    member: <MemberMembershipsPage />,
  })
}
