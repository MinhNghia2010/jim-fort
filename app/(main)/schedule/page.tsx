import { MemberSchedulePage } from "@/components/screens/member/schedule/MemberSchedulePage"
import { PtSchedulePage } from "@/components/screens/pt/schedule/PtSchedulePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SchedulePage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberSchedulePage />,
    pt: <PtSchedulePage />,
  })
}
