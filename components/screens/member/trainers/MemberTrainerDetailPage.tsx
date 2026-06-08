import Link from "next/link"

import { PageShell } from "@/components/PageShell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type Props = {
  trainerId: string
}

type TrainerRow = {
  pt_id: string
  gym_facilities: { name: string | null } | null
  users: { full_name: string | null } | null
}

export async function MemberTrainerDetailPage({ trainerId }: Props) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("facility_pts")
    .select("pt_id,gym_facilities(name),users:pt_id(full_name)")
    .eq("pt_id", trainerId)
    .maybeSingle()

  const trainer = data as unknown as TrainerRow | null

  return (
    <PageShell
      eyebrow="Member"
      title={trainer?.users?.full_name ?? "Trainer"}
      description="Review trainer information and start a PT package when ready."
      backHref="/trainers"
      backLabel="Trainers"
    >
      <Card>
        <CardHeader>
          <CardTitle>{trainer?.users?.full_name ?? "Trainer"}</CardTitle>
          <CardDescription>
            {trainer?.gym_facilities?.name ?? "Jim Fort"}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Badge className="w-fit">Available for PT assignment</Badge>
          <Button asChild>
            <Link href="/memberships">Choose PT package</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}
