import type {
  MemberStatus,
  MemberTableRow,
} from "@/components/screens/owner/members/MembersTable"
import { createClient } from "@/lib/supabase/server"

interface MemberRecord {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
}

interface PackageRecord {
  name: string
  description?: string | null
}

interface MembershipPackageOptionRecord {
  id: string
  name: string
  price: number | string
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  facility: { name: string | null } | { name: string | null }[] | null
}

interface SubscriptionRecord {
  id: string
  member_id: string
  status: MemberStatus
  base_price?: number | string
  discount_amount?: number | string
  final_price?: number | string
  has_pt_snapshot?: boolean
  duration_days_snapshot?: number | null
  session_count_snapshot?: number | null
  activated_at?: string | null
  starts_at?: string | null
  expires_at?: string | null
  cancelled_at?: string | null
  cancelled_reason?: string | null
  created_at: string
  updated_at?: string | null
  member: MemberRecord | MemberRecord[] | null
  package: PackageRecord | PackageRecord[] | null
  facility?:
    | {
        name: string | null
        address: string | null
        phone: string | null
      }
    | {
        name: string | null
        address: string | null
        phone: string | null
      }[]
    | null
  payments: Array<{
    id?: string
    amount: number | string
    method?: string | null
    status: string
    paid_at?: string | null
    created_at?: string
  }>
}

interface SessionRecord {
  id?: string
  subscription_id: string
  session_number?: number
  starts_at?: string
  ends_at?: string
  status?: string
  trainer?: { full_name: string | null } | { full_name: string | null }[] | null
}

interface MemberDetailUserRecord extends MemberRecord {
  role: string | null
  created_at: string | null
  updated_at: string | null
}

export interface MemberDetailPayment {
  id: string
  amount: number
  method: string | null
  status: string
  paidAt: string | null
  createdAt: string | null
}

export interface MemberDetailSubscription {
  id: string
  plan: string
  description: string | null
  facilityName: string
  facilityAddress: string | null
  facilityPhone: string | null
  status: MemberStatus
  basePrice: number
  discountAmount: number
  finalPrice: number
  hasPt: boolean
  durationDays: number | null
  sessionCount: number | null
  activatedAt: string | null
  startsAt: string | null
  expiresAt: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  createdAt: string
  updatedAt: string | null
  payments: MemberDetailPayment[]
}

export interface MemberDetailSession {
  id: string
  subscriptionId: string
  sessionNumber: number | null
  trainerName: string
  startsAt: string | null
  endsAt: string | null
  status: string
}

export interface MemberDetailData {
  id: string
  name: string
  phone: string | null
  avatarUrl: string | null
  createdAt: string | null
  updatedAt: string | null
  subscriptions: MemberDetailSubscription[]
  sessions: MemberDetailSession[]
}

export interface ManagerCreateMemberPlanOption {
  id: string
  label: string
  description: string
}

function getSingleRelation<T>(relation: T | T[] | null) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation
}

function getPaidRevenue(payments: SubscriptionRecord["payments"]) {
  return payments
    .filter((payment) => payment.status === "paid")
    .reduce((total, payment) => total + Number(payment.amount), 0)
}

function formatPlanTerm(packageRow: MembershipPackageOptionRecord) {
  if (packageRow.has_pt) {
    return `${packageRow.session_count ?? 0} PT sessions`
  }

  const days = packageRow.duration_days ?? 0

  if (days % 365 === 0) {
    const years = days / 365
    return `${years} ${years === 1 ? "year" : "years"}`
  }

  if (days % 30 === 0) {
    const months = days / 30
    return `${months} ${months === 1 ? "month" : "months"}`
  }

  return `${days} days`
}

export async function getManagerCreateMemberPageData() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_packages")
    .select(
      `
        id,
        name,
        price,
        has_pt,
        duration_days,
        session_count,
        facility:gym_facilities!membership_packages_facility_id_fkey(name)
      `
    )
    .eq("status", "active")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`Unable to load membership plans: ${error.message}`)
  }

  const packages = (data ?? []) as unknown as MembershipPackageOptionRecord[]

  return packages.map((packageRow): ManagerCreateMemberPlanOption => {
    const facility = getSingleRelation(packageRow.facility)
    const price = Number(packageRow.price) || 0

    return {
      id: packageRow.id,
      label: `${packageRow.name} - $${price.toLocaleString("en-US")}`,
      description: `${facility?.name?.trim() || "Facility"} · ${formatPlanTerm(packageRow)}`,
    }
  })
}

export async function getMembersPageData() {
  const supabase = await createClient()

  const [subscriptionsResult, sessionsResult] = await Promise.all([
    supabase
      .from("membership_subscriptions")
      .select(
        `
          id,
          member_id,
          status,
          created_at,
          member:users!membership_subscriptions_member_id_fkey(
            id,
            full_name,
            phone,
            avatar_url
          ),
          package:membership_packages!membership_subscriptions_package_id_fkey(
            name
          ),
          payments:membership_payments(amount, status)
        `
      )
      .order("created_at", { ascending: false }),
    supabase.from("membership_pt_sessions").select("subscription_id"),
  ])

  if (subscriptionsResult.error) {
    throw new Error(
      `Unable to load members: ${subscriptionsResult.error.message}`
    )
  }

  if (sessionsResult.error) {
    throw new Error(
      `Unable to load member sessions: ${sessionsResult.error.message}`
    )
  }

  const subscriptions = (subscriptionsResult.data ??
    []) as unknown as SubscriptionRecord[]
  const sessions = (sessionsResult.data ?? []) as unknown as SessionRecord[]
  const sessionsBySubscription = new Map<string, number>()

  sessions.forEach((session) => {
    sessionsBySubscription.set(
      session.subscription_id,
      (sessionsBySubscription.get(session.subscription_id) ?? 0) + 1
    )
  })

  const membersById = new Map<string, MemberTableRow>()

  subscriptions.forEach((subscription) => {
    const member = getSingleRelation(subscription.member)
    const membershipPackage = getSingleRelation(subscription.package)

    if (!member || !membershipPackage) {
      return
    }

    const existingMember = membersById.get(member.id)
    const revenue = getPaidRevenue(subscription.payments)
    const sessionsCount = sessionsBySubscription.get(subscription.id) ?? 0

    if (existingMember) {
      existingMember.revenue += revenue
      existingMember.sessions += sessionsCount

      if (subscription.created_at < existingMember.joinedAt) {
        existingMember.joinedAt = subscription.created_at
      }

      return
    }

    membersById.set(member.id, {
      id: member.id,
      name: member.full_name,
      phone: member.phone,
      avatarUrl: member.avatar_url,
      plan: membershipPackage.name,
      joinedAt: subscription.created_at,
      status: subscription.status,
      sessions: sessionsCount,
      revenue,
    })
  })

  return Array.from(membersById.values()).sort((a, b) =>
    b.joinedAt.localeCompare(a.joinedAt)
  )
}

function toNumber(value: number | string | null | undefined) {
  return Number(value ?? 0) || 0
}

function mapMemberDetailPayment(
  payment: SubscriptionRecord["payments"][number]
): MemberDetailPayment {
  return {
    id: payment.id ?? `${payment.status}-${payment.created_at ?? ""}`,
    amount: toNumber(payment.amount),
    method: payment.method ?? null,
    status: payment.status,
    paidAt: payment.paid_at ?? null,
    createdAt: payment.created_at ?? null,
  }
}

function mapMemberDetailSubscription(
  subscription: SubscriptionRecord
): MemberDetailSubscription | null {
  const memberPackage = getSingleRelation(subscription.package)
  const facility = getSingleRelation(subscription.facility ?? null)

  if (!memberPackage) {
    return null
  }

  return {
    id: subscription.id,
    plan: memberPackage.name,
    description: memberPackage.description ?? null,
    facilityName: facility?.name?.trim() || "Facility",
    facilityAddress: facility?.address ?? null,
    facilityPhone: facility?.phone ?? null,
    status: subscription.status,
    basePrice: toNumber(subscription.base_price),
    discountAmount: toNumber(subscription.discount_amount),
    finalPrice: toNumber(subscription.final_price),
    hasPt: Boolean(subscription.has_pt_snapshot),
    durationDays: subscription.duration_days_snapshot ?? null,
    sessionCount: subscription.session_count_snapshot ?? null,
    activatedAt: subscription.activated_at ?? null,
    startsAt: subscription.starts_at ?? null,
    expiresAt: subscription.expires_at ?? null,
    cancelledAt: subscription.cancelled_at ?? null,
    cancelledReason: subscription.cancelled_reason ?? null,
    createdAt: subscription.created_at,
    updatedAt: subscription.updated_at ?? null,
    payments: subscription.payments.map(mapMemberDetailPayment),
  }
}

function mapMemberDetailSession(session: SessionRecord): MemberDetailSession {
  const trainer = getSingleRelation(session.trainer ?? null)

  return {
    id: session.id ?? `${session.subscription_id}-${session.session_number}`,
    subscriptionId: session.subscription_id,
    sessionNumber: session.session_number ?? null,
    trainerName: trainer?.full_name?.trim() || "Trainer",
    startsAt: session.starts_at ?? null,
    endsAt: session.ends_at ?? null,
    status: session.status ?? "scheduled",
  }
}

export async function getMemberDetailData(
  memberId: string
): Promise<MemberDetailData | null> {
  const supabase = await createClient()
  const [memberResult, subscriptionsResult, sessionsResult] = await Promise.all(
    [
      supabase
        .from("users")
        .select(
          "id, full_name, phone, avatar_url, role, created_at, updated_at"
        )
        .eq("id", memberId)
        .maybeSingle(),
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
              id,
              full_name,
              phone,
              avatar_url
            ),
            package:membership_packages!membership_subscriptions_package_id_fkey(
              name,
              description
            ),
            facility:gym_facilities!membership_subscriptions_facility_id_fkey(
              name,
              address,
              phone
            ),
            payments:membership_payments(
              id,
              amount,
              method,
              status,
              paid_at,
              created_at
            )
          `
        )
        .eq("member_id", memberId)
        .order("created_at", { ascending: false }),
      supabase
        .from("membership_pt_sessions")
        .select(
          "id, subscription_id, session_number, starts_at, ends_at, status, trainer:pt_id(full_name)"
        )
        .eq("member_id", memberId)
        .order("starts_at", { ascending: false }),
    ]
  )

  if (memberResult.error) {
    throw new Error(`Unable to load member: ${memberResult.error.message}`)
  }

  if (subscriptionsResult.error) {
    throw new Error(
      `Unable to load member subscriptions: ${subscriptionsResult.error.message}`
    )
  }

  if (sessionsResult.error) {
    throw new Error(
      `Unable to load member sessions: ${sessionsResult.error.message}`
    )
  }

  const member = memberResult.data as unknown as MemberDetailUserRecord | null
  const subscriptions = (subscriptionsResult.data ??
    []) as unknown as SubscriptionRecord[]
  const subscriptionMember = subscriptions
    .map((subscription) => getSingleRelation(subscription.member))
    .find(Boolean)
  const sessions = (sessionsResult.data ?? []) as unknown as SessionRecord[]

  if (!member && !subscriptionMember && !sessions.length) {
    return null
  }

  return {
    id: member?.id ?? subscriptionMember?.id ?? memberId,
    name:
      member?.full_name?.trim() ||
      subscriptionMember?.full_name?.trim() ||
      "Member",
    phone: member?.phone ?? subscriptionMember?.phone ?? null,
    avatarUrl: member?.avatar_url ?? subscriptionMember?.avatar_url ?? null,
    createdAt: member?.created_at ?? null,
    updatedAt: member?.updated_at ?? null,
    subscriptions: subscriptions
      .map(mapMemberDetailSubscription)
      .filter((subscription): subscription is MemberDetailSubscription =>
        Boolean(subscription)
      ),
    sessions: sessions.map(mapMemberDetailSession),
  }
}
