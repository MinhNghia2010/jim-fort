import Link from "next/link"
import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  MessageSquareText,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { createClient } from "@/lib/supabase/server"

type SessionRow = {
  id: string
  session_number: number
  starts_at: string
  ends_at: string
  status: string
  users: { full_name: string | null } | null
}

type FeedbackRow = {
  session_id: string
  status: string
}

type CalendarDay = {
  date: Date
  key: string
  inMonth: boolean
}

type CalendarWeek = CalendarDay[]

type MemberSchedulePageProps = {
  month?: string
}

const timeZone = "Asia/Bangkok"
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

const monthTitle = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
  timeZone,
})

const dayNumber = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  timeZone,
})

const shortDate = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeZone,
})

const time = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone,
})

function parseMonth(value?: string) {
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

function monthParam(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function dayKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date)
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  )

  return `${values.year}-${values.month}-${values.day}`
}

function monthKey(year: number, monthIndex: number) {
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
      key: dayKey(date),
      inMonth: date.getMonth() === monthIndex,
    })
  }

  return days
}

function buildCalendarWeeks(year: number, monthIndex: number): CalendarWeek[] {
  const days = buildCalendarDays(year, monthIndex)
  const weeks: CalendarWeek[] = []

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7))
  }

  return weeks
}

function sessionClass(status: string) {
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

function formatSessionRange(startsAt: string, endsAt: string) {
  return `${time.format(new Date(startsAt))}-${time.format(new Date(endsAt))}`
}

export async function MemberSchedulePage({ month }: MemberSchedulePageProps) {
  const { year, monthIndex } = parseMonth(month)
  const selectedMonth = new Date(year, monthIndex, 1)
  const previousMonth = new Date(year, monthIndex - 1, 1)
  const nextMonth = new Date(year, monthIndex + 1, 1)
  const calendarWeeks = buildCalendarWeeks(year, monthIndex)
  const supabase = await createClient()
  const [sessionResult, feedbackResult] = await Promise.all([
    supabase
      .from("membership_pt_sessions")
      .select(
        "id,session_number,starts_at,ends_at,status,users:pt_id(full_name)"
      )
      .order("starts_at", { ascending: true }),
    supabase
      .from("pt_session_feedbacks")
      .select("session_id,status")
      .order("sent_at", { ascending: false }),
  ])

  const sessions = (sessionResult.data ?? []) as unknown as SessionRow[]
  const feedbacks = (feedbackResult.data ?? []) as unknown as FeedbackRow[]
  const feedbackBySession = new Map(
    feedbacks.map((feedback) => [feedback.session_id, feedback])
  )
  const sessionsByDay = new Map<string, SessionRow[]>()
  const currentMonthKey = monthKey(year, monthIndex)
  const monthSessions = sessions.filter((session) =>
    dayKey(new Date(session.starts_at)).startsWith(currentMonthKey)
  )

  for (const session of monthSessions) {
    const key = dayKey(new Date(session.starts_at))
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

  const now = new Date()
  const upcomingCount = monthSessions.filter(
    (session) =>
      session.status === "scheduled" && new Date(session.starts_at) >= now
  ).length
  const completedCount = monthSessions.filter(
    (session) => session.status === "completed"
  ).length
  const feedbackReceivedCount = monthSessions.filter((session) =>
    feedbackBySession.has(session.id)
  ).length
  const error = sessionResult.error ?? feedbackResult.error

  return (
    <PageShell
      eyebrow="Member"
      title="Schedule"
      description="Generated PT sessions from your accepted and paid PT subscriptions."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Schedule could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {sessions.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Month sessions</CardTitle>
                  <CardDescription>
                    {monthTitle.format(selectedMonth)}
                  </CardDescription>
                </div>
                <CalendarDays className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{monthSessions.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Upcoming</CardTitle>
                  <CardDescription>Scheduled from now</CardDescription>
                </div>
                <Clock className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{upcomingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>Completed</CardTitle>
                  <CardDescription>Marked by session status</CardDescription>
                </div>
                <CheckCircle2 className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">{completedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle>PT feedback</CardTitle>
                  <CardDescription>
                    Feedback received this month
                  </CardDescription>
                </div>
                <MessageSquareText className="size-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">
                  {feedbackReceivedCount}
                </p>
              </CardContent>
            </Card>
          </div>

          {feedbackReceivedCount ? (
            <Alert>
              <CalendarCheck />
              <AlertTitle>Trainer feedback available</AlertTitle>
              <AlertDescription>
                Open sessions with feedback to review trainer notes and next
                steps.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>{monthTitle.format(selectedMonth)}</CardTitle>
                <CardDescription>
                  Click a session to view details and trainer feedback.
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/schedule?month=${monthParam(previousMonth)}`}>
                    <ChevronLeft data-icon="inline-start" />
                    Previous
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/schedule">This month</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/schedule?month=${monthParam(nextMonth)}`}>
                    Next
                    <ChevronRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border">
                <div className="w-full" role="table">
                  <div
                    className="grid border-b bg-muted/60"
                    role="row"
                    style={{
                      gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                    }}
                  >
                    {weekdays.map((weekday) => (
                      <div
                        key={weekday}
                        className="px-3 py-3 text-sm font-medium"
                        role="columnheader"
                      >
                        {weekday}
                      </div>
                    ))}
                  </div>
                  <div role="rowgroup">
                    {calendarWeeks.map((week) => (
                      <div
                        key={week[0]?.key}
                        className="grid border-b last:border-b-0"
                        role="row"
                        style={{
                          gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                        }}
                      >
                        {week.map((day, dayIndex) => {
                          const daySessions = sessionsByDay.get(day.key) ?? []

                          return (
                            <div
                              key={day.key}
                              className={`min-h-36 p-2 ${
                                dayIndex < weekdays.length - 1 ? "border-r" : ""
                              } ${
                                day.inMonth ? "bg-background" : "bg-muted/20"
                              }`}
                              role="cell"
                            >
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span
                                  className={`text-sm ${
                                    day.inMonth
                                      ? "font-medium"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {dayNumber.format(day.date)}
                                </span>
                                {daySessions.length ? (
                                  <Badge variant="secondary">
                                    {daySessions.length}
                                  </Badge>
                                ) : null}
                              </div>
                              <div className="grid gap-1.5">
                                {daySessions.map((session) => {
                                  const feedback = feedbackBySession.get(
                                    session.id
                                  )

                                  return (
                                    <Popover key={session.id}>
                                      <PopoverTrigger asChild>
                                        <button
                                          type="button"
                                          className={`flex min-h-8 w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-colors ${sessionClass(
                                            session.status
                                          )}`}
                                        >
                                          <span className="rounded bg-background/70 px-1.5 py-0.5 font-medium tabular-nums">
                                            {time.format(
                                              new Date(session.starts_at)
                                            )}
                                          </span>
                                          <span className="min-w-0 truncate">
                                            {session.users?.full_name ??
                                              "Trainer"}
                                          </span>
                                        </button>
                                      </PopoverTrigger>
                                      <PopoverContent
                                        align="start"
                                        className="w-72 p-4"
                                      >
                                        <PopoverHeader>
                                          <PopoverTitle>
                                            {session.users?.full_name ??
                                              "Trainer"}
                                          </PopoverTitle>
                                          <PopoverDescription>
                                            Session #{session.session_number}
                                          </PopoverDescription>
                                        </PopoverHeader>
                                        <div className="grid gap-2 text-sm">
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              Date
                                            </span>
                                            <span>
                                              {shortDate.format(
                                                new Date(session.starts_at)
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              Time
                                            </span>
                                            <span>
                                              {formatSessionRange(
                                                session.starts_at,
                                                session.ends_at
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              Status
                                            </span>
                                            <StatusBadge
                                              status={session.status}
                                              showDot
                                            />
                                          </div>
                                          <div className="flex items-center justify-between gap-3">
                                            <span className="text-muted-foreground">
                                              Feedback
                                            </span>
                                            <StatusBadge
                                              status={
                                                feedback?.status ?? "not sent"
                                              }
                                              showDot
                                            >
                                              {feedback?.status ?? "not sent"}
                                            </StatusBadge>
                                          </div>
                                        </div>
                                        <Button asChild className="mt-2 w-full">
                                          <Link
                                            href={`/schedule/sessions/${session.id}`}
                                          >
                                            Open detail
                                          </Link>
                                        </Button>
                                      </PopoverContent>
                                    </Popover>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Empty className="min-h-80 border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarDays />
            </EmptyMedia>
            <EmptyTitle>No PT sessions yet</EmptyTitle>
            <EmptyDescription>
              Sessions are generated after a PT assignment is accepted and the
              subscription is paid.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </PageShell>
  )
}
