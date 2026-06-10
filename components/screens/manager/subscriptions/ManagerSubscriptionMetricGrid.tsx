import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Dumbbell,
} from "lucide-react"

import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import {
  formatSubscriptionDate,
  formatSubscriptionLabel,
  formatSubscriptionMoney,
} from "@/components/screens/shared/subscriptions/subscription-detail-utils"

import type { SubscriptionRow } from "./manager-subscription-detail-data"
import {
  getManagerSubscriptionPlanType,
  getManagerSubscriptionTermLabel,
} from "./manager-subscription-detail-utils"

type ManagerSubscriptionMetricGridProps = {
  subscription: SubscriptionRow
}

export function ManagerSubscriptionMetricGrid({
  subscription,
}: ManagerSubscriptionMetricGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ManagementMetricCard
        title="Final price"
        value={formatSubscriptionMoney(subscription.final_price)}
        detail="Subscription total"
        icon={CircleDollarSign}
      />
      <ManagementMetricCard
        title="Status"
        value={formatSubscriptionLabel(subscription.status)}
        detail="Current lifecycle state"
        icon={ClipboardList}
      />
      <ManagementMetricCard
        title="Plan type"
        value={getManagerSubscriptionPlanType(subscription)}
        detail={getManagerSubscriptionTermLabel(subscription)}
        icon={Dumbbell}
      />
      <ManagementMetricCard
        title="Created"
        value={formatSubscriptionDate(subscription.created_at)}
        detail="Subscription request date"
        icon={CalendarClock}
      />
    </div>
  )
}
