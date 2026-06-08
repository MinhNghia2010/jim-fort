import { MemberSessionFeedbackPage } from "@/components/screens/member/schedule/MemberSessionFeedbackPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SessionFeedbackPage({
  params,
}: {
  params: Promise<{ sessionsId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { sessionsId } = await params

  return renderRolePage(role, {
    member: <MemberSessionFeedbackPage sessionId={sessionsId} />,
  })
}
