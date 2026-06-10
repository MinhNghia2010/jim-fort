import { StatusBadge } from "@/components/StatusBadge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberSubscriptionRow } from "./member-subscription-detail-data"

type MemberSubscriptionStatusCardProps = {
  subscription: MemberSubscriptionRow
}

export function MemberSubscriptionStatusCard({
  subscription,
}: MemberSubscriptionStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current status</CardTitle>
        <CardDescription>
          {subscription.gym_facilities?.name ?? "Jim Fort"}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">Status</p>
          <StatusBadge status={subscription.status} showDot />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Facility</p>
          <p className="font-medium">
            {subscription.gym_facilities?.name ?? "Jim Fort"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Plan type</p>
          <p className="font-medium">
            {subscription.has_pt_snapshot ? "PT package" : "Access package"}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sessions</p>
          <p className="font-medium">
            {subscription.has_pt_snapshot
              ? (subscription.session_count_snapshot ?? "Not set")
              : "Access only"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
