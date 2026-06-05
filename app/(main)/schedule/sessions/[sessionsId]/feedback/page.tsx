import { MemberSessionFeedbackPage } from "@/components/screens/member/schedule/MemberSessionFeedbackPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SessionFeedbackPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberSessionFeedbackPage />,
  })
}
