"use client"

import { useState } from "react"
import { MessageSquare, MessageSquareReply, Star, TicketX } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import {
  OwnerFeedbackTable,
  type OwnerFeedbackRow,
} from "@/components/screens/owner/feedback/OwnerFeedbackTable"
import {
  ALL_MONTHS_VALUE,
  matchesTableMonthFilter,
} from "@/components/TableMonthFilter"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface OwnerFeedbackClientContentProps {
  feedbacks: readonly OwnerFeedbackRow[]
  errorMessage?: string
  managerActions?: boolean
}

const appTimeZone = "Asia/Ho_Chi_Minh"

function averageRatingLabel(feedbacks: readonly OwnerFeedbackRow[]) {
  const ratings = feedbacks.flatMap((feedback) =>
    feedback.rating ? [feedback.rating] : []
  )

  if (!ratings.length) {
    return "No ratings"
  }

  const average =
    ratings.reduce((total, rating) => total + rating, 0) / ratings.length

  return `${average.toFixed(1)}/5`
}

export function OwnerFeedbackClientContent({
  feedbacks,
  errorMessage,
  managerActions = false,
}: OwnerFeedbackClientContentProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const summaryFeedbacks =
    monthFilter === ALL_MONTHS_VALUE
      ? feedbacks
      : feedbacks.filter((feedback) =>
          matchesTableMonthFilter(
            feedback.createdAt,
            monthFilter,
            appTimeZone
          )
        )
  const respondedCount = summaryFeedbacks.filter(
    (feedback) => feedback.managerResponse !== null
  ).length
  const noResponseCount = summaryFeedbacks.length - respondedCount

  return (
    <PageShell
      title="Feedback"
      description="Review member facility feedback and manager responses."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Total feedback"
          value={summaryFeedbacks.length}
          detail="Facility feedback records"
          icon={MessageSquare}
        />
        <ManagementMetricCard
          title="Responded"
          value={respondedCount}
          detail="Feedback with manager response"
          icon={MessageSquareReply}
        />
        <ManagementMetricCard
          title="No response"
          value={noResponseCount}
          detail="Waiting for a manager response"
          icon={TicketX}
        />
        <ManagementMetricCard
          title="Average rating"
          value={averageRatingLabel(summaryFeedbacks)}
          detail="Rated feedback only"
          icon={Star}
        />
      </div>

      <OwnerFeedbackTable
        feedbacks={feedbacks}
        managerActions={managerActions}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
      />
    </PageShell>
  )
}
