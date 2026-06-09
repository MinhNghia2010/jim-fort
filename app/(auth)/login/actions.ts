"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { LoginActionState } from "@/lib/auth/login"
import { createClient } from "@/lib/supabase/server"

const demoLoginAccounts = {
  owner: {
    email: "owner@gmail.com",
    password: "12345678",
  },
  manager: {
    email: "manager@gmail.com",
    password: "12345678",
  },
  pt: {
    email: "pt01@gmail.com",
    password: "12345678",
  },
  member: {
    email: "member@gmail.com",
    password: "12345678",
  },
} as const

type DemoLoginRole = keyof typeof demoLoginAccounts

function getDemoLoginAccount(role: FormDataEntryValue | null) {
  if (typeof role !== "string" || role.length === 0) {
    return null
  }

  if (role in demoLoginAccounts) {
    return demoLoginAccounts[role as DemoLoginRole]
  }

  return undefined
}

export async function login(
  _state: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const demoLoginAccount = getDemoLoginAccount(formData.get("demoRole"))

  if (demoLoginAccount === undefined) {
    return { error: "Demo account is not available." }
  }

  const email =
    demoLoginAccount?.email ?? String(formData.get("email") ?? "").trim()
  const password =
    demoLoginAccount?.password ?? String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Enter your email and password." }
  }

  let signInError: { message: string } | null = null

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    signInError = error
  } catch (error) {
    console.error("Supabase Auth login request failed", error)

    return {
      error:
        "Login service is temporarily unavailable. Check your network connection and try again.",
    }
  }

  if (signInError) {
    return { error: "Email or password is incorrect." }
  }

  revalidatePath("/", "layout")
  redirect("/overview")
}
