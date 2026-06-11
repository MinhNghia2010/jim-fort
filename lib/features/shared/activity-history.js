export function isPastOrCurrentActivityDate(value, now = new Date()) {
  if (!value) {
    return false
  }

  const date = new Date(value)

  return !Number.isNaN(date.getTime()) && date.getTime() <= now.getTime()
}
