import { ManagerMemberDetailPage } from "@/components/screens/manager/members/ManagerMemberDetailPage"
import { OwnerMemberDetailPage } from "@/components/screens/owner/members/OwnerMemberDetailPage"
import { PtMemberDetailPage } from "@/components/screens/pt/members/PtMemberDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { memberId } = await params

  return renderRolePage(role, {
    owner: <OwnerMemberDetailPage memberId={memberId} />,
    manager: <ManagerMemberDetailPage memberId={memberId} />,
    pt: <PtMemberDetailPage memberId={memberId} />,
  })
}
