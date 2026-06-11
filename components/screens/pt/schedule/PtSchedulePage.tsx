import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquareWarning,
} from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { ScheduleCalendarCard } from "@/components/screens/shared/schedule/ScheduleCalendarCard"
import { ScheduleEmptyState } from "@/components/screens/shared/schedule/ScheduleEmptyState"
import { ScheduleMetricGrid } from "@/components/screens/shared/schedule/ScheduleMetricGrid"
import {
  buildScheduleCalendarWeeks,
  getScheduleMonthSessions,
  groupScheduleSessionsByDay,
  parseScheduleMonth,
  scheduleMonthTitle,
} from "@/lib/features/shared/schedule/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getPtScheduleData } from "@/lib/features/pt/schedule/data"

type PtSchedulePageProps = {
  month?: string
}

export async function PtSchedulePage({ month }: PtSchedulePageProps) {
  const { year, monthIndex } = parseScheduleMonth(month)
  const selectedMonth = new Date(year, monthIndex, 1)
  const previousMonth = new Date(year, monthIndex - 1, 1)
  const nextMonth = new Date(year, monthIndex + 1, 1)
  const calendarWeeks = buildScheduleCalendarWeeks(year, monthIndex)
  const { error, feedbacks, sessions } = await getPtScheduleData()
  const feedbackBySession = new Map(
    feedbacks.map((feedback) => [feedback.session_id, feedback])
  )
  const monthSessions = getScheduleMonthSessions(sessions, year, monthIndex)
  const sessionsByDay = groupScheduleSessionsByDay(monthSessions)
  const now = new Date()
  const upcomingCount = monthSessions.filter(
    (session) =>
      session.status === "scheduled" && new Date(session.starts_at) >= now
  ).length
  const completedCount = monthSessions.filter(
    (session) => session.status === "completed"
  ).length
  const feedbackNeededCount = monthSessions.filter(
    (session) =>
      new Date(session.starts_at) < now && !feedbackBySession.has(session.id)
  ).length

  return (
    <PageShell
      eyebrow="PT"
      title="Schedule"
      description="View assigned member sessions and send feedback."
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Schedule could not be loaded</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {sessions.length ? (
        <>
          <ScheduleMetricGrid
            metrics={[
              {
                title: "Month sessions",
                description: scheduleMonthTitle.format(selectedMonth),
                value: monthSessions.length,
                icon: CalendarDays,
              },
              {
                title: "Upcoming",
                description: "Scheduled from now",
                value: upcomingCount,
                icon: Clock,
              },
              {
                title: "Completed",
                description: "Marked by session status",
                value: completedCount,
                icon: CheckCircle2,
              },
              {
                title: "Needs feedback",
                description: "Past sessions without feedback",
                value: feedbackNeededCount,
                icon: MessageSquareWarning,
              },
            ]}
          />

          {feedbackNeededCount ? (
            <Alert>
              <CalendarCheck />
              <AlertTitle>Feedback waiting</AlertTitle>
              <AlertDescription>
                Open past sessions marked without feedback and send notes for
                the member.
              </AlertDescription>
            </Alert>
          ) : null}

          <ScheduleCalendarCard
            calendarWeeks={calendarWeeks}
            description="Click a session to view summary and open detail."
            feedbackBySession={feedbackBySession}
            nextMonth={nextMonth}
            participantFallback="Member"
            previousMonth={previousMonth}
            selectedMonth={selectedMonth}
            sessionsByDay={sessionsByDay}
          />
        </>
      ) : (
        <ScheduleEmptyState description="Sessions appear after a member accepts your assignment and pays." />
      )}
    </PageShell>
  )
}
