import { BadgePercent } from "lucide-react"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MembershipDistributionChart } from "@/components/screens/owner/memberships/MembershipDistributionChart"
import type { MembershipTypeMetric } from "@/lib/owner-overview"
import { cn } from "@/lib/utils"

interface MembershipTypesCardProps {
  memberships: readonly MembershipTypeMetric[]
  totalActive: number
}

export function MembershipTypesCard({
  memberships,
  totalActive,
}: MembershipTypesCardProps) {
  const distribution = memberships.map((membership) => ({
    name: membership.label,
    value: membership.count,
    color: membership.color,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership types</CardTitle>
        <CardDescription>Share of active subscriptions</CardDescription>
        <CardAction className="text-primary">
          <BadgePercent aria-hidden="true" className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent className="flex min-h-40 items-center gap-4">
        {memberships.length ? (
          <>
            <MembershipDistributionChart data={distribution} />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {memberships.map((membership) => (
                <div
                  key={membership.label}
                  className="flex min-w-0 items-center gap-2 text-xs"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      membership.dotColorClass
                    )}
                  />
                  <span className="truncate text-muted-foreground">
                    {membership.label}
                  </span>
                  <span className="ml-auto font-mono font-medium tabular-nums">
                    {membership.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No active membership distribution is available yet.
          </p>
        )}
      </CardContent>
      <CardFooter className="mt-auto justify-between">
        <span className="text-xs text-muted-foreground">Total active</span>
        <span className="font-heading font-semibold tabular-nums">
          {totalActive.toLocaleString("en-US")}
        </span>
      </CardFooter>
    </Card>
  )
}
