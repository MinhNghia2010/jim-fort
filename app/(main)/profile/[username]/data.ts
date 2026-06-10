import { redirect } from "next/navigation"

import { isRole, type Role } from "@/lib/routes"
import { createClient } from "@/lib/supabase/server"

export interface CurrentProfileData {
  id: string
  name: string
  email: string
  username: string
  phone: string | null
  avatarUrl: string | null
  role: Role
  createdAt: string | null
  updatedAt: string | null
}

export interface CurrentMemberMembershipData {
  id: string
  status: string
  plan: string
  facility: string
  finalPrice: number
  hasPt: boolean
  durationDays: number | null
  sessionCount: number | null
  startsAt: string | null
  expiresAt: string | null
}

type UserRecord = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
}

type MemberMembershipRecord = {
  id: string
  status: string
  final_price: number | string
  has_pt_snapshot: boolean
  duration_days_snapshot: number | null
  session_count_snapshot: number | null
  starts_at: string | null
  expires_at: string | null
  membership_packages:
    | { name: string | null }
    | { name: string | null }[]
    | null
  gym_facilities:
    | { name: string | null }
    | { name: string | null }[]
    | null
}

function getSingleRelation<T>(relation: T | T[] | null) {
  return Array.isArray(relation) ? (relation[0] ?? null) : relation
}

function getStringMetadata(
  metadata: Record<string, unknown>,
  key: string
): string | null {
  const value = metadata[key]

  return typeof value === "string" && value.trim() ? value.trim() : null
}

function getUsername(email: string, metadataUsername: string | null) {
  if (metadataUsername) {
    return metadataUsername
  }

  return email.split("@")[0] || "profile"
}

export async function getCurrentProfileData(): Promise<CurrentProfileData> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const email = user.email ?? "No email address"
  const metadata = user.user_metadata as Record<string, unknown>
  const appRole = user.app_metadata.app_role
  const fallbackName =
    getStringMetadata(metadata, "full_name") ??
    getStringMetadata(metadata, "name") ??
    email.split("@")[0] ??
    "User"

  const { data } = await supabase
    .from("users")
    .select("id, full_name, phone, avatar_url, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle()

  const profile = data as unknown as UserRecord | null
  const role = isRole(profile?.role)
    ? profile.role
    : isRole(appRole)
      ? appRole
      : "member"

  return {
    id: user.id,
    name: profile?.full_name?.trim() || fallbackName,
    email,
    username: getUsername(email, getStringMetadata(metadata, "username")),
    phone: profile?.phone?.trim() || null,
    avatarUrl: profile?.avatar_url ?? null,
    role,
    createdAt: profile?.created_at ?? user.created_at ?? null,
    updatedAt: profile?.updated_at ?? user.updated_at ?? null,
  }
}

export async function getCurrentMemberMembershipData(): Promise<{
  membership: CurrentMemberMembershipData | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data, error } = await supabase
    .from("membership_subscriptions")
    .select(
      "id,status,final_price,has_pt_snapshot,duration_days_snapshot,session_count_snapshot,starts_at,expires_at,membership_packages(name),gym_facilities(name)"
    )
    .eq("member_id", user.id)
    .in("status", ["active", "pending_payment", "pending_pt_setup"])
    .order("created_at", { ascending: false })

  if (error) {
    return {
      membership: null,
      error: `Unable to load current membership: ${error.message}`,
    }
  }

  const subscriptions = (data ?? []) as unknown as MemberMembershipRecord[]
  const subscription =
    subscriptions.find((item) => item.status === "active") ??
    subscriptions.find((item) =>
      ["pending_payment", "pending_pt_setup"].includes(item.status)
    ) ??
    null

  if (!subscription) {
    return { membership: null, error: null }
  }

  const membershipPackage = getSingleRelation(
    subscription.membership_packages
  )
  const facility = getSingleRelation(subscription.gym_facilities)

  return {
    membership: {
      id: subscription.id,
      status: subscription.status,
      plan: membershipPackage?.name?.trim() || "Membership",
      facility: facility?.name?.trim() || "Jim Fort",
      finalPrice: Number(subscription.final_price) || 0,
      hasPt: subscription.has_pt_snapshot,
      durationDays: subscription.duration_days_snapshot,
      sessionCount: subscription.session_count_snapshot,
      startsAt: subscription.starts_at,
      expiresAt: subscription.expires_at,
    },
    error: null,
  }
}
