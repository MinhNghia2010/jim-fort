import Link from "next/link"
import { Dumbbell, PackageCheck } from "lucide-react"

import { createMemberSubscription } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { createClient } from "@/lib/supabase/server"

type PackageRow = {
  id: string
  name: string
  description: string | null
  price: number | string
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  gym_facilities: { name: string | null } | null
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
})

function formatMoney(value: number | string) {
  return currency.format(Number(value) || 0)
}

export async function MemberMembershipsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_packages")
    .select(
      "id,name,description,price,has_pt,duration_days,session_count,gym_facilities(name)"
    )
    .eq("status", "active")
    .order("has_pt", { ascending: true })
    .order("price", { ascending: true })

  const packages = (data ?? []) as unknown as PackageRow[]

  return (
    <PageShell
      eyebrow="Member"
      title="Membership Plans"
      description="Choose an access package or start a PT package setup."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Plans could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {packages.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((plan) => (
            <Card key={plan.id}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  {plan.gym_facilities?.name ?? "Jim Fort"}
                </CardDescription>
                <CardAction>
                  <Badge variant={plan.has_pt ? "default" : "secondary"}>
                    {plan.has_pt ? "PT" : "Access"}
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="flex items-end justify-between gap-4">
                  <p className="text-2xl font-semibold">
                    {formatMoney(plan.price)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {plan.has_pt
                      ? `${plan.session_count ?? 0} sessions`
                      : `${plan.duration_days ?? 0} days`}
                  </p>
                </div>
                <p className="min-h-12 text-sm text-muted-foreground">
                  {plan.description ??
                    (plan.has_pt
                      ? "Includes PT assignment, schedule approval, and session tracking."
                      : "Facility access plan without personal training setup.")}
                </p>
                <MemberActionForm
                  action={createMemberSubscription}
                  submitLabel={plan.has_pt ? "Start PT setup" : "Subscribe"}
                  pendingLabel="Creating"
                >
                  <input type="hidden" name="packageId" value={plan.id} />
                </MemberActionForm>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PackageCheck />
            </EmptyMedia>
            <EmptyTitle>No active plans available</EmptyTitle>
            <EmptyDescription>
              Active membership packages will appear here when available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
        <Dumbbell data-icon="inline-start" />
        PT package flow: subscribe, save preferences, wait for manager assignment,
        accept the PT, then pay from{" "}
        <Link href="/subscriptions" className="font-medium underline">
          Subscriptions
        </Link>
        .
      </div>
    </PageShell>
  )
}
