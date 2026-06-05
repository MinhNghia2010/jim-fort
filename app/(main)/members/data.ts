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
}

interface SubscriptionRecord {
  id: string
  member_id: string
  status: MemberStatus
  created_at: string
  member: MemberRecord | MemberRecord[] | null
  package: PackageRecord | PackageRecord[] | null
  payments: Array<{
    amount: number | string
    status: string
  }>
}

interface SessionRecord {
  subscription_id: string
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
