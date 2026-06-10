export type ScheduleSessionRow = {
  id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null } | null
}

export type ScheduleFeedbackRow = {
  session_id: string
  status: string
}

export type CalendarDay = {
  date: Date
  key: string
  inMonth: boolean
}

export type CalendarWeek = CalendarDay[]

export const scheduleTimeZone = "Asia/Bangkok"
export const scheduleWeekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const scheduleMonthTitle = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone: scheduleTimeZone,
})

export const scheduleDayNumber = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  timeZone: scheduleTimeZone,
})

export const scheduleShortDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone: scheduleTimeZone,
})

export const scheduleTime = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: scheduleTimeZone,
})

export function parseScheduleMonth(value?: string) {
  const match = value?.match(/^(\d{4})-(\d{2})$/)
  const now = new Date()

  if (!match) {
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
    }
  }

  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1

  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
    }
  }

  return { year, monthIndex }
}

export function scheduleMonthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

export function scheduleDayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: scheduleTimeZone,
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

export function scheduleMonthKey(year: number, monthIndex: number) {
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`
}

function mondayFirstOffset(date: Date) {
  return (date.getDay() + 6) % 7
}

function buildCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstOfMonth = new Date(year, monthIndex, 1)
  const firstCalendarDay = new Date(firstOfMonth)

  firstCalendarDay.setDate(
    firstCalendarDay.getDate() - mondayFirstOffset(firstOfMonth)
  )

  const days: CalendarDay[] = []

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(firstCalendarDay)

    date.setDate(firstCalendarDay.getDate() + index)
    days.push({
      date,
      key: scheduleDayKey(date),
      inMonth: date.getMonth() === monthIndex,
    })
  }

  return days
}

export function buildScheduleCalendarWeeks(
  year: number,
  monthIndex: number
): CalendarWeek[] {
  const days = buildCalendarDays(year, monthIndex)
  const weeks: CalendarWeek[] = []

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }

  return weeks
}

export function scheduleSessionClass(status: string) {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950 hover:bg-emerald-100"
  }

  if (status === "cancelled" || status === "missed") {
    return "border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive/15"
  }

  if (status === "rescheduled") {
    return "border-amber-200 bg-amber-50 text-amber-950 hover:bg-amber-100"
  }

  return "border-primary/20 bg-primary/10 text-foreground hover:bg-primary/15"
}

export function formatScheduleSessionRange(startsAt: string, endsAt: string) {
  return `${scheduleTime.format(new Date(startsAt))}-${scheduleTime.format(
    new Date(endsAt)
  )}`
}

export function getScheduleMonthSessions(
  sessions: readonly ScheduleSessionRow[],
  year: number,
  monthIndex: number
) {
  const currentMonthKey = scheduleMonthKey(year, monthIndex)

  return sessions.filter((session) =>
    scheduleDayKey(new Date(session.starts_at)).startsWith(currentMonthKey)
  )
}

export function groupScheduleSessionsByDay(
  sessions: readonly ScheduleSessionRow[]
) {
  const sessionsByDay = new Map<string, ScheduleSessionRow[]>()

  for (const session of sessions) {
    const key = scheduleDayKey(new Date(session.starts_at))
    const daySessions = sessionsByDay.get(key) ?? []

    daySessions.push(session)
    sessionsByDay.set(key, daySessions)
  }

  for (const daySessions of sessionsByDay.values()) {
    daySessions.sort(
      (first, second) =>
        new Date(first.starts_at).getTime() -
        new Date(second.starts_at).getTime()
    )
  }

  return sessionsByDay
}
