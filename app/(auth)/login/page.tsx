import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"

import { LoginPage } from "@/components/login/LoginPage"
import { createClient } from "@/lib/supabase/server"

import { login } from "./actions"

export default async function LoginRoute() {
  const supabase = await createClient()
  let user: User | null = null

  try {
    const {
      data: { user: authenticatedUser },
    } = await supabase.auth.getUser()

    user = authenticatedUser
  } catch (error) {
    console.error("Supabase Auth login page session check failed", error)
  }

  if (user) {
    redirect("/overview")
  }

  return <LoginPage action={login} />
}
