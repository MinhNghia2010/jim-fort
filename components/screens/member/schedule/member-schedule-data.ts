import { createClient } from "@/lib/supabase/server"

import type {
  ScheduleFeedbackRow,
  ScheduleSessionRow,
} from "@/components/screens/shared/schedule/schedule-utils"

export async function getMemberScheduleData() {
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,session_number,starts_at,ends_at,status,users:pt_id(full_name)"
      )
      .order("starts_at", { ascending: true }),
    supabase
      .from("pt_session_feedbacks")
      .select("session_id,status")
      .order("sent_at", { ascending: false }),
  ])

  return {
    error: sessionResult.error ?? feedbackResult.error,
    feedbacks: (feedbackResult.data ?? []) as unknown as ScheduleFeedbackRow[],
    sessions: (sessionResult.data ?? []) as unknown as ScheduleSessionRow[],
  }
}
