import { MessageSquare, MessageSquareReply, Star, TicketX } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import {
  OwnerFeedbackTable,
  type FacilityFeedbackStatus,
  type OwnerFeedbackRow,
} from "@/components/screens/owner/feedback/OwnerFeedbackTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"

type UserRelation = {
  full_name: string | null
  phone?: string | null
  role?: string | null
}

type FeedbackRecord = {
  id: string
  subject: string
  message: string
  rating: number | null
  status: FacilityFeedbackStatus
  manager_response: string | null
  responded_at: string | null
  created_at: string
  member: UserRelation | UserRelation[] | null
  respondent: UserRelation | UserRelation[] | null
}

function getSingleRelation<T>(relation: T | T[] | null | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

function formatRole(role: string | null | undefined) {
  if (!role) {
    return null
  }

  if (role === "pt") {
    return "PT"
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function mapFeedback(feedback: FeedbackRecord): OwnerFeedbackRow {
  const member = getSingleRelation(feedback.member)
  const respondent = getSingleRelation(feedback.respondent)

  return {
    id: feedback.id,
    subject: feedback.subject,
    message: feedback.message,
    rating: feedback.rating,
    status: feedback.status,
    managerResponse: feedback.manager_response,
    respondedAt: feedback.responded_at,
    createdAt: feedback.created_at,
    memberName: member?.full_name?.trim() || "Unknown member",
    memberPhone: member?.phone?.trim() || "No phone number",
    responderName: respondent?.full_name?.trim() || null,
    responderRole: formatRole(respondent?.role),
  }
}

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

export async function OwnerFeedbackPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facility_feedbacks")
    .select(
      `
        id,
        subject,
        message,
        rating,
        status,
        manager_response,
        responded_at,
        created_at,
        member:users!facility_feedbacks_member_id_fkey(
          full_name,
          phone
        ),
        respondent:users!facility_feedbacks_responded_by_manager_id_fkey(
          full_name,
          role
        )
      `
    )
    .order("created_at", { ascending: false })

  const feedbacks = ((data ?? []) as unknown as FeedbackRecord[]).map(
    mapFeedback
  )
  const respondedCount = feedbacks.filter(
    (feedback) => feedback.managerResponse !== null
  ).length
  const noResponseCount = feedbacks.length - respondedCount

  return (
    <PageShell
      title="Feedback"
      description="Review member facility feedback and manager responses."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Feedback could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ManagementMetricCard
          title="Total feedback"
          value={feedbacks.length}
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
          value={averageRatingLabel(feedbacks)}
          detail="Rated feedback only"
          icon={Star}
        />
      </div>

      <OwnerFeedbackTable feedbacks={feedbacks} />
    </PageShell>
  )
}
