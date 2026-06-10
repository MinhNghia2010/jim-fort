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

type UserRecord = {
  id: string
  full_name: string | null
  phone: string | null
  avatar_url: string | null
  role: string | null
  created_at: string | null
  updated_at: string | null
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
