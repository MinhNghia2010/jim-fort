import { OwnerFeedbackClientContent } from "@/components/screens/owner/feedback/OwnerFeedbackClientContent"
import {
  type FacilityFeedbackStatus,
  type OwnerFeedbackRow,
} from "@/components/screens/owner/feedback/OwnerFeedbackTable"
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

interface OwnerFeedbackPageProps {
  managerActions?: boolean
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

export async function OwnerFeedbackPage({
  managerActions = false,
}: OwnerFeedbackPageProps = {}) {
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

  return (
    <OwnerFeedbackClientContent
      feedbacks={feedbacks}
      errorMessage={error?.message}
      managerActions={managerActions}
    />
  )
}
