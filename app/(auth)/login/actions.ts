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

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: "Email or password is incorrect." }
  }

  revalidatePath("/", "layout")
  redirect("/overview")
}
