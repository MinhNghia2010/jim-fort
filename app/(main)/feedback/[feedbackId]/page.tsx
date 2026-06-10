import { ManagerFeedbackDetailPage } from "@/components/screens/manager/feedback/ManagerFeedbackDetailPage"
import { OwnerFeedbackDetailPage } from "@/components/screens/owner/feedback/OwnerFeedbackDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface FeedbackDetailPageProps {
  params: Promise<{
    feedbackId: string
  }>
}

export default async function FeedbackDetailPage({
  params,
}: FeedbackDetailPageProps) {
  const role = await getAuthenticatedRole()
  const { feedbackId } = await params

  return renderRolePage(role, {
    owner: <OwnerFeedbackDetailPage feedbackId={feedbackId} />,
    manager: <ManagerFeedbackDetailPage feedbackId={feedbackId} />,
  })
}
