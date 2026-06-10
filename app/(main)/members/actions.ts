"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { getOwnerMemberAccess } from "@/app/(main)/members/owner-member-access"
import type { DeleteActionState } from "@/components/DeleteConfirmationDialog"

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

export async function deleteMember(
  _state: DeleteActionState,
  formData: FormData
): Promise<DeleteActionState> {
  const memberId = text(formData, "memberId")

  if (!memberId) {
    return { error: "Select a member to delete." }
  }

  const access = await getOwnerMemberAccess(memberId)

  if ("error" in access) {
    return { error: access.error }
  }

  const { admin, member } = access

  const { data: deletedMember, error: deleteError } = await admin
    .from("users")
    .delete()
    .eq("id", memberId)
    .eq("role", "member")
    .select("id")
    .maybeSingle()

  if (deleteError) {
    return {
      error: `Unable to delete member records: ${deleteError.message}`,
    }
  }

  if (!deletedMember) {
    return { error: "The member account was not deleted." }
  }

  const cleanupErrors: string[] = []

  if (member.account_id) {
    const { error: accountError } = await admin
      .from("accounts")
      .delete()
      .eq("id", member.account_id)

    if (accountError) {
      cleanupErrors.push(`app account: ${accountError.message}`)
    }
  }

  const { error: authError } = await admin.auth.admin.deleteUser(memberId)

  if (authError) {
    cleanupErrors.push(`login account: ${authError.message}`)
  }

  revalidatePath("/members")
  revalidatePath(`/members/${memberId}`)
  revalidatePath("/memberships")
  revalidatePath("/subscriptions")
  revalidatePath("/revenue")
  revalidatePath("/overview")

  if (cleanupErrors.length) {
    return {
      error: `Member records were deleted, but cleanup failed for ${cleanupErrors.join("; ")}.`,
    }
  }

  return { message: `${member.full_name} was deleted.` }
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

  redirect(`/members/${memberId}`)
}
