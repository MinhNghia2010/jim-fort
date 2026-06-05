import { ManagerFeedbackDetailPage } from "@/components/screens/manager/feedback/ManagerFeedbackDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FeedbackDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    manager: <ManagerFeedbackDetailPage />,
  })
}
