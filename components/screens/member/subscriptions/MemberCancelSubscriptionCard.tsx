import { X } from "lucide-react"

import { cancelPendingSubscription } from "@/app/(main)/member-actions"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberSubscriptionRow } from "@/lib/features/member/subscriptions/detail-data"

type MemberCancelSubscriptionCardProps = {
  subscription: MemberSubscriptionRow
}

export function MemberCancelSubscriptionCard({
  subscription,
}: MemberCancelSubscriptionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cancel pending subscription</CardTitle>
        <CardDescription>
          Stop this setup before choosing another membership plan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MemberActionForm
          action={cancelPendingSubscription}
          submitLabel="Cancel subscription"
          pendingLabel="Cancelling"
          buttonVariant="outline"
          successMessage="Subscription cancelled"
        >
          <input type="hidden" name="subscriptionId" value={subscription.id} />
          <X data-icon="inline-start" />
        </MemberActionForm>
      </CardContent>
    </Card>
  )
}
