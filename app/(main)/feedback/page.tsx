import { ManagerFeedbackPage } from "@/components/screens/manager/feedback/ManagerFeedbackPage"
import { MemberFeedbackPage } from "@/components/screens/member/feedback/MemberFeedbackPage"
import { OwnerFeedbackPage } from "@/components/screens/owner/feedback/OwnerFeedbackPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FeedbackPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerFeedbackPage />,
    manager: <ManagerFeedbackPage />,
    member: <MemberFeedbackPage />,
  })
}
