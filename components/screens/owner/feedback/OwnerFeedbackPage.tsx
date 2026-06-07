<<<<<<< HEAD
import { RoutePlaceholder } from "@/components/RoutePlaceholder"

export function OwnerFeedbackPage() {
  return <RoutePlaceholder title="Owner Feedback" />
=======
import {
  Inbox,
  MessageCircleReply,
  MessageSquareText,
  Star,
} from "lucide-react"

import { getOwnerFeedbackPageData } from "@/app/(main)/feedback/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerFeedbackTable } from "@/components/screens/owner/feedback/OwnerFeedbackTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export type FeedbackStatus = "open" | "in_review" | "responded" | "closed"

export interface OwnerFeedbackRow {
  id: string
  subject: string
  message: string
  rating: number | null
  ratingLabel: string
  status: FeedbackStatus
  memberName: string
  memberPhone: string
  managerResponse: string | null
  respondedByName: string | null
  respondedByRole: string
  respondedAt: string | null
  respondedAtLabel: string | null
  createdAt: string
  createdAtLabel: string
}

export interface OwnerFeedbackPageProps {
  rows: readonly OwnerFeedbackRow[]
  totalFeedbackCount: number
  responseCount: number
  pendingResponseCount: number
  averageRatingLabel: string
  errorMessage?: string
}

export function OwnerFeedbackContent({
  rows,
  totalFeedbackCount,
  responseCount,
  pendingResponseCount,
  averageRatingLabel,
  errorMessage,
}: OwnerFeedbackPageProps) {
  return (
    <PageShell
      title="Feedback"
      description="Review member facility feedback and the responses sent by managers."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Total feedback"
          value={totalFeedbackCount}
          detail="Member facility feedback"
          icon={MessageSquareText}
        />
        <ManagementMetricCard
          title="Responded"
          value={responseCount}
          detail="Feedback with manager responses"
          icon={MessageCircleReply}
        />
        <ManagementMetricCard
          title="No response"
          value={pendingResponseCount}
          detail="Feedback without manager responses"
          icon={Inbox}
        />
        <ManagementMetricCard
          title="Average rating"
          value={averageRatingLabel}
          detail="Facility feedback ratings"
          icon={Star}
        />
      </div>

      <OwnerFeedbackTable rows={rows} />
    </PageShell>
  )
}

export async function OwnerFeedbackPage() {
  const feedbackPageProps = await getOwnerFeedbackPageData()

  return <OwnerFeedbackContent {...feedbackPageProps} />
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
}
