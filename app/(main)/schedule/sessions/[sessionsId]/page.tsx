import { MemberScheduleSessionPage } from "@/components/screens/member/schedule/MemberScheduleSessionPage"
import { PtScheduleSessionPage } from "@/components/screens/pt/schedule/PtScheduleSessionPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function ScheduleSessionPage({
  params,
}: {
  params: Promise<{ sessionsId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { sessionsId } = await params

  return renderRolePage(role, {
    member: <MemberScheduleSessionPage sessionId={sessionsId} />,
    pt: <PtScheduleSessionPage sessionId={sessionsId} />,
  })
}
