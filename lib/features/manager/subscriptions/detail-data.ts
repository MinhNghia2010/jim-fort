import { createClient } from "@/lib/supabase/server"

import type {
  Relation,
  SubscriptionTimeSlot,
} from "@/lib/features/shared/subscriptions/detail-utils"

export type MemberRelation = {
  full_name: string | null
  phone: string | null
}

export type PackageRelation = {
  name: string | null
  description: string | null
}

export type FacilityRelation = {
  name: string | null
  address: string | null
  phone: string | null
}

export type SubscriptionRow = {
  id: string
  member_id: string
  status: string
  base_price: number | string
  discount_amount: number | string
  final_price: number | string
  has_pt_snapshot: boolean
  duration_days_snapshot: number | null
  session_count_snapshot: number | null
  activated_at: string | null
  starts_at: string | null
  expires_at: string | null
  cancelled_at: string | null
  cancelled_reason: string | null
  created_at: string
  updated_at: string | null
  member: Relation<MemberRelation>
  package: Relation<PackageRelation>
  facility: Relation<FacilityRelation>
}

export type PreferenceRow = {
  sessions_per_week: number
  preferred_pt_gender: string
  experience_level: string
  training_goal: string | null
  notes: string | null
  preferred_pt: Relation<{ full_name: string | null }>
  membership_pt_preference_time_slots: SubscriptionTimeSlot[] | null
}

export type AssignmentRow = {
  id: string
  status: string
  schedule_note: string | null
  member_response_note: string | null
  assigned_at: string | null
  member_decided_at: string | null
  users: Relation<{ full_name: string | null }>
  membership_pt_assignment_schedule_slots: SubscriptionTimeSlot[] | null
}

export type PaymentRow = {
  id: string
  amount: number | string
  method: string | null
  status: string
  paid_at: string | null
  created_at: string
  payer_name: string | null
  payer_phone: string | null
  cardholder_name: string | null
  card_last_four: string | null
  card_expiry: string | null
}

export async function getManagerSubscriptionDetailData(subscriptionId: string) {
  const supabase = await createClient()
  const [
    subscriptionResult,
    preferenceResult,
    assignmentResult,
    paymentResult,
  ] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select(
        `
          id,
          member_id,
          status,
          base_price,
          discount_amount,
          final_price,
          has_pt_snapshot,
          duration_days_snapshot,
          session_count_snapshot,
          activated_at,
          starts_at,
          expires_at,
          cancelled_at,
          cancelled_reason,
          created_at,
          updated_at,
          member:users!membership_subscriptions_member_id_fkey(
            full_name,
            phone
          ),
          package:membership_packages!membership_subscriptions_package_id_fkey(
            name,
            description
          ),
          facility:gym_facilities!membership_subscriptions_facility_id_fkey(
            name,
            address,
            phone
          )
        `
      )
      .eq("id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("membership_pt_preferences")
      .select(
        "sessions_per_week,preferred_pt:preferred_pt_id(full_name),preferred_pt_gender,experience_level,training_goal,notes,membership_pt_preference_time_slots(day_of_week,start_time,end_time)"
      )
      .eq("subscription_id", subscriptionId)
      .maybeSingle(),
    supabase
      .from("membership_pt_assignments")
      .select(
        "id,status,schedule_note,member_response_note,assigned_at,member_decided_at,users:pt_id(full_name),membership_pt_assignment_schedule_slots(day_of_week,start_time,end_time)"
      )
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
    supabase
      .from("membership_payments")
      .select(
        "id,amount,method,status,paid_at,created_at,payer_name,payer_phone,cardholder_name,card_last_four,card_expiry"
      )
      .eq("subscription_id", subscriptionId)
      .order("created_at", { ascending: false }),
  ])

  return {
    assignments: (assignmentResult.data ?? []) as unknown as AssignmentRow[],
    error:
      subscriptionResult.error ??
      preferenceResult.error ??
      assignmentResult.error ??
      paymentResult.error,
    payments: (paymentResult.data ?? []) as unknown as PaymentRow[],
    preference: preferenceResult.data as unknown as PreferenceRow | null,
    subscription: subscriptionResult.data as unknown as SubscriptionRow | null,
  }
}
