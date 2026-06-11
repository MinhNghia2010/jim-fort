import { redirect } from "next/navigation"

import { LoginPage } from "@/components/login/LoginPage"
import { getOptionalAuthenticatedUser } from "@/lib/auth/current-user"

import { login } from "./actions"

export default async function LoginRoute() {
  const user = await getOptionalAuthenticatedUser()

  if (user) {
    redirect("/overview")
  }

  return <LoginPage action={login} />
}
