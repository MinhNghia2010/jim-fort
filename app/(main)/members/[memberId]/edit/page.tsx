import { OwnerEditMemberPage } from "@/components/screens/owner/members/OwnerEditMemberPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ memberId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { memberId } = await params

  return renderRolePage(role, {
    owner: <OwnerEditMemberPage memberId={memberId} />,
  })
}
