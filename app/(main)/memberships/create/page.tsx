import { OwnerCreateMembershipPage } from "@/components/screens/owner/memberships/OwnerCreateMembershipPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function CreateMembershipPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerCreateMembershipPage />,
  })
}
