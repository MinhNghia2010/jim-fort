import Link from "next/link"
import {
  Building2,
  CalendarDays,
  CreditCard,
  Dumbbell,
  PackageCheck,
} from "lucide-react"

import { getCurrentMemberMembershipData } from "@/app/(main)/profile/[username]/data"
import { StatusBadge } from "@/components/StatusBadge"
import {
  formatSubscriptionDate,
  formatSubscriptionMoney,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

function MembershipDetail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof PackageCheck
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Icon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="break-words font-medium">{value}</p>
      </div>
    </div>
  )
}

export async function MemberCurrentMembershipCard() {
  const { error, membership } = await getCurrentMemberMembershipData()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Current membership could not be loaded</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (!membership) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Current membership</CardTitle>
          <CardDescription>
            Your active or pending membership plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageCheck />
              </EmptyMedia>
              <EmptyTitle>No current membership</EmptyTitle>
              <EmptyDescription>
                Choose a membership plan to begin your subscription.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild>
                <Link href="/memberships">Browse memberships</Link>
              </Button>
            </EmptyContent>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  const allowance = membership.hasPt
    ? `${membership.sessionCount ?? "Not set"} sessions`
    : `${membership.durationDays ?? "Not set"} access days`

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{membership.plan}</CardTitle>
        <CardDescription>Current membership</CardDescription>
        <CardAction>
          <StatusBadge status={membership.status} showDot />
        </CardAction>
      </CardHeader>
      <CardContent className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <MembershipDetail
          icon={Building2}
          label="Facility"
          value={membership.facility}
        />
        <MembershipDetail
          icon={CreditCard}
          label="Membership price"
          value={formatSubscriptionMoney(membership.finalPrice)}
        />
        <MembershipDetail
          icon={Dumbbell}
          label="Package type"
          value={membership.hasPt ? "PT package" : "Access package"}
        />
        <MembershipDetail
          icon={PackageCheck}
          label={membership.hasPt ? "Training sessions" : "Access duration"}
          value={allowance}
        />
        <MembershipDetail
          icon={CalendarDays}
          label="Start date"
          value={formatSubscriptionDate(membership.startsAt)}
        />
        <MembershipDetail
          icon={CalendarDays}
          label="Expiry date"
          value={formatSubscriptionDate(membership.expiresAt)}
        />
      </CardContent>
      <CardFooter className="justify-end">
        <Button asChild variant="outline">
          <Link href={`/subscriptions/${membership.id}`}>
            View membership
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
