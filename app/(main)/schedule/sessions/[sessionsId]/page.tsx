import { MemberScheduleSessionPage } from "@/components/screens/member/schedule/MemberScheduleSessionPage"
import { PtScheduleSessionPage } from "@/components/screens/pt/schedule/PtScheduleSessionPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function ScheduleSessionPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberScheduleSessionPage />,
    pt: <PtScheduleSessionPage />,
  })
}
