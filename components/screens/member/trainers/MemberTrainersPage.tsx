import Link from "next/link"
import { Dumbbell } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

type TrainerRow = {
  pt_id: string
  gym_facilities: { name: string | null } | null
  users: { full_name: string | null } | null
}

export async function MemberTrainersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facility_pts")
    .select("pt_id,gym_facilities(name),users:pt_id(full_name)")
    .order("created_at", { ascending: true })

  const trainers = (data ?? []) as unknown as TrainerRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Trainers"
      description="Browse available facility PTs before choosing a PT package."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Trainers could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {trainers.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {trainers.map((trainer) => (
            <Card key={trainer.pt_id}>
              <CardHeader>
                <CardTitle>
                  {trainer.users?.full_name ?? "Trainer"}
                </CardTitle>
                <CardDescription>
                  {trainer.gym_facilities?.name ?? "Jim Fort"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Badge variant="secondary">Available PT</Badge>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/trainers/${trainer.pt_id}`}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Dumbbell />
            </EmptyMedia>
            <EmptyTitle>No trainers available</EmptyTitle>
            <EmptyDescription>
              Facility trainers will appear here when available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
