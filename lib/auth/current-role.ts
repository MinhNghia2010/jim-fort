import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { isRole, type Role } from "@/lib/routes"
import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedRole(): Promise<Role> {
  const supabase = await createClient()
  let user: User | null = null

  try {
    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser()

    user = authenticatedUser
  } catch (error) {
    console.error("Supabase Auth role lookup failed", error)
    redirect("/login")
  }

  if (!user) {
    redirect("/login")
  }

  return isRole(user.app_metadata.app_role)
    ? user.app_metadata.app_role
    : "member"
}
