"use server"

import { revalidatePath } from "next/cache"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

type ProfileActionState = {
  error?: string
  message?: string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function usernameFromEmail(email: string | undefined | null) {
  return email?.split("@")[0] || "profile"
}

export async function updateCurrentProfile(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const fullName = text(formData, "fullName")
  const phone = text(formData, "phone")

  if (!fullName) {
    return { error: "Enter your full name." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: "Sign in to update your profile." }
  }

  const admin = createAdminClient()
  const { error: profileError } = await admin
    .from("users")
    .update({
      full_name: fullName,
      phone: phone || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (profileError) {
    return { error: `Unable to update profile: ${profileError.message}` }
  }

  const { error: authError } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      full_name: fullName,
      name: fullName,
      phone,
    },
  })

  if (authError) {
    return {
      error: `Profile was updated, but auth metadata was not synced: ${authError.message}`,
    }
  }

  const username = usernameFromEmail(user.email)

  revalidatePath("/overview")
  revalidatePath(`/profile/${username}`)
  revalidatePath(`/profile/${username}/edit`)
  revalidatePath("/", "layout")

  return { message: "Profile updated" }
}
