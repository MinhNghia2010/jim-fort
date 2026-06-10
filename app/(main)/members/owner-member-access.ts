import "server-only"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function getOwnerMemberAccess(memberId: string) {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { error: "Sign in as an owner to manage members." }
  }

  if (user.app_metadata.app_role !== "owner") {
    return { error: "Only owners can manage member accounts." }
  }

  const admin = createAdminClient()
  const [memberResult, ownerFacilitiesResult, subscriptionsResult] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, full_name, phone, role")
        .eq("id", memberId)
        .maybeSingle(),
      supabase.from("gym_facilities").select("id").eq("owner_id", user.id),
      supabase
        .from("membership_subscriptions")
        .select("id, facility_id")
        .eq("member_id", memberId),
    ])

  const queryError =
    memberResult.error ??
    ownerFacilitiesResult.error ??
    subscriptionsResult.error

  if (queryError) {
    return { error: `Unable to verify member access: ${queryError.message}` }
  }

  const member = memberResult.data

  if (!member || member.role !== "member") {
    return { error: "This member account is not available." }
  }

  const ownerFacilityIds = new Set(
    (ownerFacilitiesResult.data ?? []).map((facility) => facility.id)
  )
  const subscriptions = subscriptionsResult.data ?? []

  if (
    !subscriptions.length ||
    subscriptions.some(
      (subscription) => !ownerFacilityIds.has(subscription.facility_id)
    )
  ) {
    return {
      error:
        "This member has records outside your owned facilities and cannot be managed here.",
    }
  }

  const { data: adminMember, error: adminMemberError } = await admin
    .from("users")
    .select("id, account_id, full_name, phone, role")
    .eq("id", memberId)
    .eq("role", "member")
    .maybeSingle()

  if (adminMemberError) {
    return {
      error: `Unable to load member account: ${adminMemberError.message}`,
    }
  }

  if (!adminMember) {
    return { error: "This member account is not available." }
  }

  return { admin, member: adminMember }
}
