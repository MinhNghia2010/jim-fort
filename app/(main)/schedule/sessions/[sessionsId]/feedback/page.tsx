import { redirect } from "next/navigation"

export default async function SessionFeedbackPage({
  params,
}: {
  params: Promise<{ sessionsId: string }>
}) {
  const { sessionsId } = await params

  redirect(`/schedule/sessions/${sessionsId}`)
}
