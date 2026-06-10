import { OwnerFeedbackDetailPage } from "@/components/screens/owner/feedback/OwnerFeedbackDetailPage"

interface ManagerFeedbackDetailPageProps {
  feedbackId: string
}

export function ManagerFeedbackDetailPage({
  feedbackId,
}: ManagerFeedbackDetailPageProps) {
  return <OwnerFeedbackDetailPage feedbackId={feedbackId} canRespond />
}
