"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"

type ActionState = {
  error?: string
}

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim()
}

function ratingValue(value: string) {
  if (!value) {
    return null
  }

  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5
    ? parsed
    : null
}

export async function sendPtSessionFeedback(
  _state: ActionState,
  formData: FormData
): Promise<ActionState> {
  const sessionId = text(formData, "sessionId")
  const feedback = text(formData, "feedback")
  const nextSteps = text(formData, "nextSteps")
  const rating = ratingValue(text(formData, "rating"))

  if (!sessionId || !feedback) {
    return { error: "Enter session feedback before sending." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user || user.app_metadata.app_role !== "pt") {
    return { error: "Only PT users can send session feedback." }
  }

  const { error } = await supabase.from("pt_session_feedbacks").upsert(
    {
      session_id: sessionId,
      pt_id: user.id,
      feedback,
      rating,
      next_steps: nextSteps || null,
      status: "sent",
    },
    { onConflict: "session_id" }
  )

  if (error) {
    return { error: `Unable to send feedback: ${error.message}` }
  }

  revalidatePath("/schedule")
  revalidatePath(`/schedule/sessions/${sessionId}`)

  return {}
}
