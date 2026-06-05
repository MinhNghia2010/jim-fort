import { redirect } from "next/navigation"

import { LoginPage } from "@/components/login/LoginPage"
import { createClient } from "@/lib/supabase/server"

import { login } from "./actions"

export default async function LoginRoute() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect("/overview")
  }

  return <LoginPage action={login} />
}
