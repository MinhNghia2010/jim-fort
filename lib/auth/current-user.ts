import { cache } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import {
  authContextHeader,
  createAuthContext,
  parseAuthContext,
  type AuthenticatedUser,
} from "@/lib/auth/auth-context"
import { createClient } from "@/lib/supabase/server"

const getCurrentUser = cache(async (): Promise<AuthenticatedUser | null> => {
  const headerStore = await headers()
  const forwardedContext = parseAuthContext(headerStore.get(authContextHeader))

  if (forwardedContext) {
    return forwardedContext
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error) {
    console.error("Supabase Auth claims lookup failed", error)
    return null
  }

  return data?.claims ? createAuthContext(data.claims) : null
})

export async function getOptionalAuthenticatedUser() {
  return getCurrentUser()
}

export async function getAuthenticatedUser() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/login")
  }

  return user
}
