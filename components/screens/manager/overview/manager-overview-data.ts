import { type EquipmentStatus } from "@/lib/owner-overview"
import { createClient } from "@/lib/supabase/server"

export type UserRelation = {
  full_name: string | null
  phone?: string | null
}

export type PackageRelation = {
  name: string | null
}

export type SubscriptionRecord = {
  id: string
  member_id: string
  package_id: string
  status: string
  final_price: number | string | null
  activated_at: string | null
  created_at: string
  users: UserRelation | UserRelation[] | null
  membership_packages: PackageRelation | PackageRelation[] | null
}

export type PaymentRecord = {
  amount: number | string
  status: string
  paid_at: string | null
  created_at: string
}

export type EquipmentRecord = {
  id: string
  name: string
  status: EquipmentStatus
}

export type StaffRecord = {
  id: string
  status: string
  role: string | null
}

export type FacilityPtRecord = {
  pt_id: string
}

export type FeedbackRecord = {
  id: string
  subject: string
  status: string
  rating: number | null
  manager_response: string | null
  created_at: string
  member: UserRelation | UserRelation[] | null
}

export type FacilityRecord = {
  id: string
}

export type RoomRecord = {
  id: string
}

export async function getManagerOverviewData() {
  const supabase = await createClient()
  const [
    subscriptionsResult,
    paymentsResult,
    equipmentResult,
    staffsResult,
    ptsResult,
    facilitiesResult,
    roomsResult,
    feedbackResult,
  ] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select(
        "id, member_id, package_id, status, final_price, activated_at, created_at, users:member_id(full_name, phone), membership_packages(name)"
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("membership_payments")
      .select("amount, status, paid_at, created_at")
      .eq("status", "paid"),
    supabase.from("gym_equipments").select("id, name, status"),
    supabase.from("staffs").select("id, status, role"),
    supabase.from("facility_pts").select("pt_id"),
    supabase.from("gym_facilities").select("id"),
    supabase.from("rooms").select("id"),
    supabase
      .from("facility_feedbacks")
      .select(
        "id, subject, status, rating, manager_response, created_at, member:users!facility_feedbacks_member_id_fkey(full_name)"
      )
      .order("created_at", { ascending: false }),
  ])

  const errorMessages = [
    subscriptionsResult.error,
    paymentsResult.error,
    equipmentResult.error,
    staffsResult.error,
    ptsResult.error,
    facilitiesResult.error,
    roomsResult.error,
    feedbackResult.error,
  ].flatMap((error) => (error ? [error.message] : []))

  return {
    errorMessages,
    subscriptions: (subscriptionsResult.data ??
      []) as unknown as SubscriptionRecord[],
    payments: (paymentsResult.data ?? []) as unknown as PaymentRecord[],
    equipments: (equipmentResult.data ?? []) as unknown as EquipmentRecord[],
    staffs: (staffsResult.data ?? []) as unknown as StaffRecord[],
    pts: (ptsResult.data ?? []) as unknown as FacilityPtRecord[],
    facilities: (facilitiesResult.data ?? []) as unknown as FacilityRecord[],
    rooms: (roomsResult.data ?? []) as unknown as RoomRecord[],
    feedbacks: (feedbackResult.data ?? []) as unknown as FeedbackRecord[],
  }
}
