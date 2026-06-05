import { redirect } from "next/navigation"

import { isRole, type Role } from "@/lib/routes"
import { createClient } from "@/lib/supabase/server"

export async function getAuthenticatedRole(): Promise<Role> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return isRole(user.app_metadata.app_role)
    ? user.app_metadata.app_role
    : "member"
}
