import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
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
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  formatScheduleSessionRange,
  getScheduleSessionStatus,
  scheduleDayNumber,
  scheduleMonthParam,
  scheduleMonthTitle,
  scheduleSessionClass,
  scheduleShortDate,
  scheduleTime,
  scheduleWeekdays,
  type CalendarWeek,
  type ScheduleFeedbackRow,
  type ScheduleSessionRow,
} from "@/lib/features/shared/schedule/utils"

type ScheduleCalendarCardProps = {
  calendarWeeks: CalendarWeek[]
  description: string
  feedbackBySession: Map<string, ScheduleFeedbackRow>
  nextMonth: Date
  participantFallback: string
  previousMonth: Date
  selectedMonth: Date
  sessionsByDay: Map<string, ScheduleSessionRow[]>
}

export function ScheduleCalendarCard({
  calendarWeeks,
  description,
  feedbackBySession,
  nextMonth,
  participantFallback,
  previousMonth,
  selectedMonth,
  sessionsByDay,
}: ScheduleCalendarCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>{scheduleMonthTitle.format(selectedMonth)}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/schedule?month=${scheduleMonthParam(previousMonth)}`}>
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/schedule">This month</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/schedule?month=${scheduleMonthParam(nextMonth)}`}>
              Next
              <ChevronRight data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <div className="w-full" role="table">
            <ScheduleCalendarHeader />
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
                  {week.map((day, dayIndex) => (
                    <ScheduleCalendarDayCell
                      day={day}
                      dayIndex={dayIndex}
                      feedbackBySession={feedbackBySession}
                      key={day.key}
                      participantFallback={participantFallback}
                      sessions={sessionsByDay.get(day.key) ?? []}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ScheduleCalendarHeader() {
  return (
    <div
      className="grid border-b bg-muted/60"
      role="row"
      style={{
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
      }}
    >
      {scheduleWeekdays.map((weekday) => (
        <div
          key={weekday}
          className="px-3 py-3 text-sm font-medium"
          role="columnheader"
        >
          {weekday}
        </div>
      ))}
    </div>
  )
}

type ScheduleCalendarDayCellProps = {
  day: CalendarWeek[number]
  dayIndex: number
  feedbackBySession: Map<string, ScheduleFeedbackRow>
  participantFallback: string
  sessions: ScheduleSessionRow[]
}

function ScheduleCalendarDayCell({
  day,
  dayIndex,
  feedbackBySession,
  participantFallback,
  sessions,
}: ScheduleCalendarDayCellProps) {
  return (
    <div
      className={`min-h-36 p-2 ${
        dayIndex < scheduleWeekdays.length - 1 ? "border-r" : ""
      } ${day.inMonth ? "bg-background" : "bg-muted/20"}`}
      role="cell"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span
          className={`text-sm ${
            day.inMonth ? "font-medium" : "text-muted-foreground"
          }`}
        >
          {scheduleDayNumber.format(day.date)}
        </span>
        {sessions.length ? (
          <Badge variant="secondary">{sessions.length}</Badge>
        ) : null}
      </div>
      <div className="grid gap-1.5">
        {sessions.map((session) => (
          <ScheduleSessionPopover
            feedback={feedbackBySession.get(session.id)}
            key={session.id}
            participantFallback={participantFallback}
            session={session}
          />
        ))}
      </div>
    </div>
  )
}

type ScheduleSessionPopoverProps = {
  feedback: ScheduleFeedbackRow | undefined
  participantFallback: string
  session: ScheduleSessionRow
}

function ScheduleSessionPopover({
  feedback,
  participantFallback,
  session,
}: ScheduleSessionPopoverProps) {
  const participantName = session.users?.full_name ?? participantFallback
  const status = getScheduleSessionStatus(session)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`flex min-h-8 w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-colors ${scheduleSessionClass(
            status
          )}`}
        >
          <span className="rounded bg-background/70 px-1.5 py-0.5 font-medium tabular-nums">
            {scheduleTime.format(new Date(session.starts_at))}
          </span>
          <span className="min-w-0 truncate">{participantName}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4">
        <PopoverHeader>
          <PopoverTitle>{participantName}</PopoverTitle>
          <PopoverDescription>
            Session #{session.session_number}
          </PopoverDescription>
        </PopoverHeader>
        <div className="grid gap-2 text-sm">
          <ScheduleSessionDetail
            label="Date"
            value={scheduleShortDate.format(new Date(session.starts_at))}
          />
          <ScheduleSessionDetail
            label="Time"
            value={formatScheduleSessionRange(
              session.starts_at,
              session.ends_at
            )}
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={status} showDot />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">Feedback</span>
            <StatusBadge status={feedback?.status ?? "not sent"} showDot>
              {feedback?.status ?? "not sent"}
            </StatusBadge>
          </div>
        </div>
        <Button asChild className="mt-2 w-full">
          <Link href={`/schedule/sessions/${session.id}`}>Open detail</Link>
        </Button>
      </PopoverContent>
    </Popover>
  )
}

type ScheduleSessionDetailProps = {
  label: string
  value: string
}

function ScheduleSessionDetail({ label, value }: ScheduleSessionDetailProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  )
}
