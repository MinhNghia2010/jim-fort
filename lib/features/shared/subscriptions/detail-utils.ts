import { currencyFormatter } from "@/lib/owner-overview"

export type Relation<T> = T | T[] | null

export type SubscriptionTimeSlot = {
  day_of_week: number
  start_time: string
  end_time: string
}

export const subscriptionWeekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

export const subscriptionWeeklySlotIndexes = [0, 1, 2, 3, 4, 5, 6]

const subscriptionDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Ho_Chi_Minh",
})

export function getSingleRelation<T>(relation: Relation<T> | undefined) {
  if (Array.isArray(relation)) {
    return relation[0] ?? null
  }

  return relation ?? null
}

export function toSubscriptionNumber(
  value: number | string | null | undefined
) {
  const numberValue = Number(value ?? 0)

  return Number.isFinite(numberValue) ? numberValue : 0
}

export function formatSubscriptionMoney(
  value: number | string | null | undefined
) {
  return currencyFormatter.format(toSubscriptionNumber(value))
}

export function formatSubscriptionDate(value: string | null | undefined) {
  if (!value) {
    return "Not recorded"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "Not recorded"
  }

  return subscriptionDateFormatter.format(date)
}

export function formatSubscriptionLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set"
  }

  return value
    .replaceAll("_", " ")
    .split(" ")
    .map((word) => (word.toLowerCase() === "pt" ? "PT" : word))
    .map((word) =>
      word === "PT" ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ")
}

export function sortSubscriptionSlots(
  slots: SubscriptionTimeSlot[] | null | undefined
) {
  return [...(slots ?? [])].sort(
    (first, second) =>
      first.day_of_week - second.day_of_week ||
      first.start_time.localeCompare(second.start_time)
  )
}

export function formatSubscriptionSlot(slot: SubscriptionTimeSlot) {
  return `${
    subscriptionWeekdays[slot.day_of_week] ?? "Day"
  } ${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}`
}
