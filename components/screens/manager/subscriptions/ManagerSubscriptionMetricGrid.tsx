import {
  CalendarClock,
  CircleDollarSign,
  ClipboardList,
  Dumbbell,
} from "lucide-react"

import { SummaryCard } from "@/components/SummaryCard"
import {
  formatSubscriptionDate,
  formatSubscriptionLabel,
  formatSubscriptionMoney,
} from "@/lib/features/shared/subscriptions/detail-utils"

import type { SubscriptionRow } from "@/lib/features/manager/subscriptions/detail-data"
import {
  getManagerSubscriptionPlanType,
  getManagerSubscriptionTermLabel,
} from "@/lib/features/manager/subscriptions/detail-utils"

type ManagerSubscriptionMetricGridProps = {
  subscription: SubscriptionRow
}

export function ManagerSubscriptionMetricGrid({
  subscription,
}: ManagerSubscriptionMetricGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        title="Final price"
        value={formatSubscriptionMoney(subscription.final_price)}
        description="Subscription total"
        icon={CircleDollarSign}
      />
      <SummaryCard
        title="Status"
        value={formatSubscriptionLabel(subscription.status)}
        description="Current lifecycle state"
        icon={ClipboardList}
      />
      <SummaryCard
        title="Plan type"
        value={getManagerSubscriptionPlanType(subscription)}
        description={getManagerSubscriptionTermLabel(subscription)}
        icon={Dumbbell}
      />
      <SummaryCard
        title="Created"
        value={formatSubscriptionDate(subscription.created_at)}
        description="Subscription request date"
        icon={CalendarClock}
      />
    </div>
  )
}
