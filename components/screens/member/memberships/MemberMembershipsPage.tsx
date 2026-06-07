import { BadgePercent, Check, Clock, Dumbbell, MapPin } from "lucide-react"

import { createMemberSubscription } from "@/app/(main)/member-actions"
import { PageShell } from "@/components/PageShell"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

type MembershipPackageRow = {
  id: string
  name: string
  description: string | null
  price: number | string
  has_pt: boolean
  duration_days: number | null
  session_count: number | null
  gym_facilities: { name: string | null } | null
  membership_package_rooms: {
    rooms: { name: string | null } | null
  }[]
}

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
})

function formatCurrency(value: number | string) {
  return currencyFormatter.format(Number(value) || 0)
}

function formatTerm(plan: MembershipPackageRow) {
  if (plan.has_pt) {
    return `${plan.session_count ?? 0} PT sessions`
  }

  const days = plan.duration_days ?? 0

  if (days % 365 === 0) {
    const years = days / 365
    return `${years} ${years === 1 ? "year" : "years"} access`
  }

  if (days % 30 === 0) {
    const months = days / 30
    return `${months} ${months === 1 ? "month" : "months"} access`
  }

  return `${days} days access`
}

export async function MemberMembershipsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("membership_packages")
    .select(
      "id,name,description,price,has_pt,duration_days,session_count,gym_facilities(name),membership_package_rooms(rooms(name))"
    )
    .eq("status", "active")
    .order("price", { ascending: true })

  const plans = (data ?? []) as unknown as MembershipPackageRow[]

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

      {plans.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {plans.map((plan) => {
            const rooms = plan.membership_package_rooms
              .map((item) => item.rooms?.name)
              .filter(Boolean)

            return (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>
                        {plan.description ?? "Membership package"}
                      </CardDescription>
                    </div>
                    <Badge variant={plan.has_pt ? "default" : "secondary"}>
                      {plan.has_pt ? "PT" : "Access"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="rounded-lg bg-muted p-4">
                    <p className="font-heading text-3xl font-semibold">
                      {formatCurrency(plan.price)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTerm(plan)}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="size-4" />
                      <span>{plan.gym_facilities?.name ?? "Facility"}</span>
                    </div>
                    <div className="flex items-start gap-2 text-muted-foreground">
                      {plan.has_pt ? (
                        <Dumbbell className="mt-0.5 size-4" />
                      ) : (
                        <Clock className="mt-0.5 size-4" />
                      )}
                      <span>
                        {plan.has_pt
                          ? "Submit preferences, wait for PT assignment, then pay."
                          : "Pay after subscribing to activate facility access."}
                      </span>
                    </div>
                    {rooms.map((room) => (
                      <div key={room} className="flex items-center gap-2">
                        <Check className="size-4 text-primary" />
                        <span>{room}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <MemberActionForm
                    action={createMemberSubscription}
                    submitLabel={plan.has_pt ? "Start PT setup" : "Subscribe"}
                    pendingLabel="Creating"
                    buttonClassName="w-full"
                  >
                    <input type="hidden" name="packageId" value={plan.id} />
                  </MemberActionForm>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent>
            <Empty className="min-h-64">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <BadgePercent />
                </EmptyMedia>
                <EmptyTitle>No active plans available</EmptyTitle>
                <EmptyDescription>
                  Active membership packages will appear here when available.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        </Card>
      )}
    </PageShell>
  )
}
