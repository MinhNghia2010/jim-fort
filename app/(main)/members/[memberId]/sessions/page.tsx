import { PtMemberSessionsPage } from "@/components/screens/pt/members/PtMemberSessionsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MemberSessionsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    pt: <PtMemberSessionsPage />,
  })
}
