"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getOwnerMemberAccess } from "@/app/(main)/members/owner-member-access"
import type { DeleteActionState } from "@/components/DeleteConfirmationDialog"
import { cancellablePlanStatuses } from "@/lib/features/owner/members/cancel-plan"
import { withRedirectToast } from "@/lib/redirect-toast"

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

async function cancelFuturePtSessions(
  admin: ReturnType<typeof import("@/lib/supabase/admin").createAdminClient>,
  subscriptionIds: readonly string[],
  memberId: string,
  cancelledAt: string
) {
  if (!subscriptionIds.length) {
    return null
  }

  const { error } = await admin
    .from("membership_pt_sessions")
    .update({ status: "cancelled" })
    .in("subscription_id", subscriptionIds)
    .eq("member_id", memberId)
    .eq("status", "scheduled")
    .gte("starts_at", cancelledAt)

  return error
}

export async function cancelMemberPlan(
  _state: DeleteActionState,
  formData: FormData
): Promise<DeleteActionState> {
  const memberId = text(formData, "memberId")

  if (!memberId) {
    return { error: "Select a member plan to cancel." }
  }

  const access = await getOwnerMemberAccess(memberId)

  if ("error" in access) {
    return { error: access.error }
  }

  const { admin, member } = access
  const { data: subscriptions, error: loadError } = await admin
    .from("membership_subscriptions")
    .select("id")
    .eq("member_id", memberId)
    .in("status", cancellablePlanStatuses)

  if (loadError) {
    return { error: `Unable to load current plans: ${loadError.message}` }
  }

  const subscriptionIds = (subscriptions ?? []).map(
    (subscription) => subscription.id
  )

  if (!subscriptionIds.length) {
    return { error: "This member has no active or pending plan to cancel." }
  }

  const cancelledAt = new Date().toISOString()
  const { data: cancelledSubscriptions, error: cancelError } = await admin
    .from("membership_subscriptions")
    .update({
      status: "cancelled",
      cancelled_at: cancelledAt,
      cancelled_reason: "Cancelled by owner.",
    })
    .in("id", subscriptionIds)
    .in("status", cancellablePlanStatuses)
    .select("id")

  if (cancelError) {
    return { error: `Unable to cancel member plan: ${cancelError.message}` }
  }

  const cancelledSubscriptionIds = (cancelledSubscriptions ?? []).map(
    (subscription) => subscription.id
  )

  if (!cancelledSubscriptionIds.length) {
    return { error: "The member plan was not cancelled." }
  }

  const { error: paymentError } = await admin
    .from("membership_payments")
    .update({ status: "cancelled" })
    .in("subscription_id", cancelledSubscriptionIds)
    .eq("member_id", memberId)
    .eq("status", "pending")

  if (paymentError) {
    return {
      error: `Plan was cancelled, but pending payment cleanup failed: ${paymentError.message}`,
    }
  }

  const sessionError = await cancelFuturePtSessions(
    admin,
    cancelledSubscriptionIds,
    memberId,
    cancelledAt
  )

  if (sessionError) {
    return {
      error: `Plan was cancelled, but future PT sessions were not cancelled: ${sessionError.message}`,
    }
  }

  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  revalidatePath("/memberships")
  revalidatePath("/subscriptions")
  revalidatePath("/payments")
  revalidatePath("/overview")

  return { message: `${member.full_name}'s plan was cancelled.` }
}

export async function updateMember(
  _state: DeleteActionState,
  formData: FormData
): Promise<DeleteActionState> {
  const memberId = text(formData, "memberId")
  const fullName = text(formData, "fullName")
  const phone = text(formData, "phone")

  if (!memberId) {
    return { error: "Select a member to edit." }
  }

  if (!fullName) {
    return { error: "Enter the member full name." }
  }

  const access = await getOwnerMemberAccess(memberId)

  if ("error" in access) {
    return { error: access.error }
  }

  const { admin } = access
  const updatedAt = new Date().toISOString()
  const { data: updatedMember, error: updateError } = await admin
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: updatedAt,
    })
    .eq("id", memberId)
    .eq("role", "member")
    .select("id")
    .maybeSingle()

  if (updateError) {
    return { error: `Unable to update member: ${updateError.message}` }
  }

  if (!updatedMember) {
    return { error: "The member profile was not updated." }
  }

  const { data: authUserResult, error: authUserError } =
    await admin.auth.admin.getUserById(memberId)

  if (authUserError) {
    return {
      error: `Member profile updated, but login metadata could not be loaded: ${authUserError.message}`,
    }
  }

  const { error: authUpdateError } = await admin.auth.admin.updateUserById(
    memberId,
    {
      user_metadata: {
        ...authUserResult.user.user_metadata,
        full_name: fullName,
        name: fullName,
        phone,
      },
    }
  )

  if (authUpdateError) {
    return {
      error: `Member profile updated, but login metadata was not synchronized: ${authUpdateError.message}`,
    }
  }

  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  revalidatePath(`/members/${memberId}/edit`)
  revalidatePath("/overview")

  redirect(
    withRedirectToast(`/members/${memberId}`, `${fullName} was updated.`)
  )
}
