import { StatusBadge } from "@/components/StatusBadge"
import { SubscriptionDetailRow } from "@/components/screens/shared/subscriptions/SubscriptionInfoRows"
import {
  formatSubscriptionDate,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { SubscriptionRow } from "./manager-subscription-detail-data"

type ManagerSubscriptionDetailsCardProps = {
  facilityName: string
  memberName: string
  memberPhone: string
  planDescription: string
  subscription: SubscriptionRow
}

export function ManagerSubscriptionDetailsCard({
  facilityName,
  memberName,
  memberPhone,
  planDescription,
  subscription,
}: ManagerSubscriptionDetailsCardProps) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Subscription details</CardTitle>
        <CardDescription>{planDescription}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SubscriptionDetailRow label="Member" value={memberName} />
          <SubscriptionDetailRow label="Member phone" value={memberPhone} />
          <SubscriptionDetailRow label="Facility" value={facilityName} />
          <SubscriptionDetailRow label="Status">
            <StatusBadge status={subscription.status} showDot />
          </SubscriptionDetailRow>
          <SubscriptionDetailRow
            label="Started"
            value={formatSubscriptionDate(subscription.starts_at)}
          />
          <SubscriptionDetailRow
            label="Expires"
            value={formatSubscriptionDate(subscription.expires_at)}
          />
          <SubscriptionDetailRow
            label="Activated"
            value={formatSubscriptionDate(subscription.activated_at)}
          />
          <SubscriptionDetailRow
            label="Cancelled"
            value={formatSubscriptionDate(subscription.cancelled_at)}
          />
          <SubscriptionDetailRow
            label="Updated"
            value={formatSubscriptionDate(subscription.updated_at)}
          />
        </div>

        {subscription.cancelled_reason ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <p className="font-medium">Cancellation reason</p>
            <p className="mt-1 text-muted-foreground">
              {subscription.cancelled_reason}
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
