export const cancellablePlanStatuses = [
  "active",
  "pending_payment",
  "pending_pt_setup",
]

export function isCancellablePlanStatus(status) {
  return cancellablePlanStatuses.includes(status)
}
