import Link from "next/link"
import { Dumbbell, UserRound } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

type FacilityPtRow = {
  facility_id: string
  pt_id: string
  created_at: string
  gym_facilities: { name: string | null } | null
  users: {
    full_name: string | null
    phone: string | null
    avatar_url: string | null
  } | null
}

export async function MemberTrainersPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("facility_pts")
    .select(
      "facility_id,pt_id,created_at,gym_facilities(name),users:pt_id(full_name,phone,avatar_url)"
    )
    .order("created_at", { ascending: true })

  const trainers = (data ?? []) as unknown as FacilityPtRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Trainers"
      description="Personal trainers available in facilities where you have membership history."
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
            <Card key={`${trainer.facility_id}-${trainer.pt_id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <UserRound className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="truncate">
                      {trainer.users?.full_name ?? "Trainer"}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {trainer.gym_facilities?.name ?? "Facility trainer"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Personal trainer</Badge>
                  {trainer.users?.phone ? (
                    <Badge variant="outline">{trainer.users.phone}</Badge>
                  ) : null}
                </div>
                <Button asChild variant="outline">
                  <Link href={`/trainers/${trainer.pt_id}`}>View trainer</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Dumbbell />
                </EmptyMedia>
                <EmptyTitle>No trainers available yet</EmptyTitle>
                <EmptyDescription>
                  Trainers appear after your facility assigns PT users.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
