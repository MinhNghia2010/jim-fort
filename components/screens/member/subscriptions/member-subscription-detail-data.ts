import { createClient } from "@/lib/supabase/server"

import type { SubscriptionTimeSlot } from "@/components/screens/shared/subscriptions/subscription-detail-utils"

export type MemberSubscriptionRow = {
  id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  session_count_snapshot: number | null
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

export type MemberPtRow = {
  pt_id: string
  users: { full_name: string | null } | null
}

export type MemberAssignmentRow = {
  id: string
  status: string
  schedule_note: string | null
  users: { full_name: string | null } | null
  membership_pt_assignment_schedule_slots: SubscriptionTimeSlot[] | null
}

export type MemberPreferenceRow = {
  id: string
  preferred_pt_id: string | null
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  sessions_per_week: number
  membership_pt_preference_time_slots: SubscriptionTimeSlot[] | null
}

export async function getMemberSubscriptionDetailData(subscriptionId: string) {
  const supabase = await createClient()
  const [subscriptionResult, ptResult, preferenceResult, assignmentResult] =
    await Promise.all([
      supabase
        .from("membership_subscriptions")
        .select(
          "id,status,base_price,discount_amount,final_price,has_pt_snapshot,session_count_snapshot,membership_packages(name),gym_facilities(name)"
        )
        .eq("id", subscriptionId)
        .single(),
      supabase
        .from("facility_pts")
        .select("pt_id,users:pt_id(full_name)")
        .order("created_at", { ascending: true }),
      supabase
        .from("membership_pt_preferences")
        .select(
          "id,preferred_pt_id,preferred_pt_gender,experience_level,training_goal,notes,sessions_per_week,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", subscriptionId)
        .maybeSingle(),
      supabase
        .from("membership_pt_assignments")
        .select(
          "id,status,schedule_note,users:pt_id(full_name),membership_pt_assignment_schedule_slots(day_of_week,start_time,end_time)"
        )
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false }),
    ])

  return {
    assignments: (assignmentResult.data ??
      []) as unknown as MemberAssignmentRow[],
    error:
      subscriptionResult.error ??
      ptResult.error ??
      preferenceResult.error ??
      assignmentResult.error,
    preference: preferenceResult.data as unknown as MemberPreferenceRow | null,
    pts: (ptResult.data ?? []) as unknown as MemberPtRow[],
    subscription:
      subscriptionResult.data as unknown as MemberSubscriptionRow | null,
  }
}
