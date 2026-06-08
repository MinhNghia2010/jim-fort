"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import type { LoginActionState } from "@/lib/auth/login"
import { createClient } from "@/lib/supabase/server"

export async function login(
  _state: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

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
