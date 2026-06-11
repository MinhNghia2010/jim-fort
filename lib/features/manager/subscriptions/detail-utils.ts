import { toSubscriptionNumber } from "@/lib/features/shared/subscriptions/detail-utils"

import type {
  PaymentRow,
  SubscriptionRow,
} from "./detail-data"

export function getManagerSubscriptionTermLabel(
  subscription: SubscriptionRow
) {
  if (subscription.has_pt_snapshot) {
    return `${subscription.session_count_snapshot ?? 0} PT sessions`
  }

  return `${subscription.duration_days_snapshot ?? 0} access days`
}

export function getManagerSubscriptionPlanType(
  subscription: SubscriptionRow
) {
  return subscription.has_pt_snapshot ? "PT package" : "Access package"
}

export function getTotalPaid(payments: readonly PaymentRow[]) {
  return payments
    .filter((payment) => payment.status === "paid")
    .reduce(
      (total, payment) => total + toSubscriptionNumber(payment.amount),
      0
    )
}
