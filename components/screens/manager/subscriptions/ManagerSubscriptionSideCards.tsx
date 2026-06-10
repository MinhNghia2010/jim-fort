import Link from "next/link"
import { UserRound } from "lucide-react"

import { SubscriptionSummaryRow } from "@/components/screens/shared/subscriptions/SubscriptionInfoRows"
import { formatSubscriptionMoney } from "@/components/screens/shared/subscriptions/subscription-detail-utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type { SubscriptionRow } from "./manager-subscription-detail-data"

type ManagerSubscriptionSideCardsProps = {
  facilityAddress: string
  facilityName: string
  facilityPhone: string
  memberName: string
  memberPhone: string
  subscription: SubscriptionRow
}

export function ManagerSubscriptionSideCards({
  facilityAddress,
  facilityName,
  facilityPhone,
  memberName,
  memberPhone,
  subscription,
}: ManagerSubscriptionSideCardsProps) {
  return (
    <div className="grid content-start gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="size-5 text-muted-foreground" />
            Member
          </CardTitle>
          <CardDescription>Linked member account.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SubscriptionSummaryRow label="Name" value={memberName} />
          <SubscriptionSummaryRow label="Phone" value={memberPhone} />
          <Button asChild variant="outline" className="mt-2">
            <Link href={`/members/${subscription.member_id}`}>View member</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Price summary</CardTitle>
          <CardDescription>
            Snapshot captured at subscription time.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SubscriptionSummaryRow
            label="Base price"
            value={formatSubscriptionMoney(subscription.base_price)}
          />
          <SubscriptionSummaryRow
            label="Discount"
            value={formatSubscriptionMoney(subscription.discount_amount)}
          />
          <Separator />
          <SubscriptionSummaryRow
            label="Final price"
            value={formatSubscriptionMoney(subscription.final_price)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facility</CardTitle>
          <CardDescription>Where this membership is managed.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          <SubscriptionSummaryRow label="Name" value={facilityName} />
          <SubscriptionSummaryRow label="Phone" value={facilityPhone} />
          <SubscriptionSummaryRow label="Address" value={facilityAddress} />
        </CardContent>
      </Card>
    </div>
  )
}
