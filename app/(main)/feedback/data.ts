import type {
  FeedbackStatus,
  OwnerFeedbackPageProps,
  OwnerFeedbackRow,
} from "@/components/screens/owner/feedback/OwnerFeedbackPage"
import { createClient } from "@/lib/supabase/server"

type UserRecord = {
  full_name: string | null
  phone: string | null
  role?: string | null
}

type FeedbackRecord = {
  id: string
  subject: string
  message: string
  rating: number | null
  status: FeedbackStatus | string
  manager_response: string | null
  responded_at: string | null
  created_at: string
  member: UserRecord | UserRecord[] | null
  respondent: UserRecord | UserRecord[] | null
}

const ratingFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
})

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Ho_Chi_Minh",
})

function getOne<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value
}

function isFeedbackStatus(status: string): status is FeedbackStatus {
  return (
    status === "open" ||
    status === "in_review" ||
    status === "responded" ||
    status === "closed"
  )
}

function formatRole(role: string | null | undefined) {
  if (role === "pt") {
    return "PT"
  }

  if (!role) {
    return "Staff"
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

function mapFeedback(record: FeedbackRecord): OwnerFeedbackRow {
  const member = getOne(record.member)
  const respondent = getOne(record.respondent)
  const rating = typeof record.rating === "number" ? record.rating : null

  return {
    id: record.id,
    subject: record.subject,
    message: record.message,
    rating,
    ratingLabel: rating ? `${rating}/5` : "No rating",
    status: isFeedbackStatus(record.status) ? record.status : "open",
    memberName: member?.full_name?.trim() || "Unknown member",
    memberPhone: member?.phone?.trim() || "No phone number",
    managerResponse: record.manager_response?.trim() || null,
    respondedByName: respondent?.full_name?.trim() || null,
    respondedByRole: formatRole(respondent?.role),
    respondedAt: record.responded_at,
    respondedAtLabel: record.responded_at
      ? dateTimeFormatter.format(new Date(record.responded_at))
      : null,
    createdAt: record.created_at,
    createdAtLabel: dateTimeFormatter.format(new Date(record.created_at)),
  }
}

function getAverageRatingLabel(rows: readonly OwnerFeedbackRow[]) {
  const ratings = rows
    .map((row) => row.rating)
    .filter((rating): rating is number => rating !== null)

  if (!ratings.length) {
    return "N/A"
  }

  const average =
    ratings.reduce((total, rating) => total + rating, 0) / ratings.length

  return `${ratingFormatter.format(average)}/5`
}

export async function getOwnerFeedbackPageData(): Promise<OwnerFeedbackPageProps> {
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

  const rows = ((data ?? []) as unknown as FeedbackRecord[]).map(mapFeedback)
  const responseCount = rows.filter((row) => row.managerResponse).length
  const pendingResponseCount = rows.filter((row) => !row.managerResponse).length

  return {
    rows,
    totalFeedbackCount: rows.length,
    responseCount,
    pendingResponseCount,
    averageRatingLabel: getAverageRatingLabel(rows),
    errorMessage: error?.message,
  }
}
