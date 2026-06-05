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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Progress } from "@/components/ui/progress"
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Membership types</CardTitle>
        <CardDescription>Share of active subscriptions</CardDescription>
        <CardAction className="text-primary">
          <BadgePercent aria-hidden="true" className="size-4" />
        </CardAction>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-2">
          {memberships.map((membership) => (
            <Item key={membership.label} size="xs">
              <ItemMedia>
                <span
                  className={cn(
                    "size-2 rounded-full",
                    membership.dotColorClass
                  )}
                />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle>{membership.label}</ItemTitle>
                <Progress
                  value={membership.percentage}
                  className={cn("mt-1.5", membership.progressColorClass)}
                />
              </ItemContent>
              <ItemActions className="text-xs text-muted-foreground tabular-nums">
                {membership.percentage}%
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
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
