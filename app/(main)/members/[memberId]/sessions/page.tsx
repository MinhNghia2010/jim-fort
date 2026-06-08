import { PtMemberSessionsPage } from "@/components/screens/pt/members/PtMemberSessionsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MemberSessionsPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { memberId } = await params

  return renderRolePage(role, {
    pt: <PtMemberSessionsPage memberId={memberId} />,
  })
}
