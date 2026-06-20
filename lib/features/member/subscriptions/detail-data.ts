import { createClient } from "@/lib/supabase/server"

import type { SubscriptionTimeSlot } from "@/lib/features/shared/subscriptions/detail-utils"

export type MemberSubscriptionRow = {
  id: string
  member_id: string
  facility_id: string
  package_id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  session_count_snapshot: number | null
  membership_packages: { name: string | null } | null
  gym_facilities: { name: string | null } | null
}

export type MemberReplacementSubscriptionRow = {
  id: string
  membership_packages: { name: string | null } | null
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
          "id,member_id,facility_id,package_id,status,base_price,discount_amount,final_price,has_pt_snapshot,session_count_snapshot,membership_packages(name),gym_facilities(name)"
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
  const subscription =
    subscriptionResult.data as unknown as MemberSubscriptionRow | null
  const shouldCheckReplacement = Boolean(
    subscription?.member_id &&
    subscription.facility_id &&
    subscription.package_id &&
    subscription.status === "pending_payment"
  )
  const replacementResult = shouldCheckReplacement
    ? await supabase
        .from("membership_subscriptions")
        .select("id,membership_packages(name)")
        .eq("member_id", subscription?.member_id ?? "")
        .eq("facility_id", subscription?.facility_id ?? "")
        .eq("status", "active")
        .neq("id", subscription?.id ?? "")
        .neq("package_id", subscription?.package_id ?? "")
        .order("activated_at", { ascending: false })
    : { data: [], error: null }

  return {
    assignments: (assignmentResult.data ??
      []) as unknown as MemberAssignmentRow[],
    error:
      subscriptionResult.error ??
      ptResult.error ??
      preferenceResult.error ??
      assignmentResult.error ??
      replacementResult.error,
    preference: preferenceResult.data as unknown as MemberPreferenceRow | null,
    pts: (ptResult.data ?? []) as unknown as MemberPtRow[],
    replacementSubscriptions: (replacementResult.data ??
      []) as unknown as MemberReplacementSubscriptionRow[],
    subscription,
  }
}
