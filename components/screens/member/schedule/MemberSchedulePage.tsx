import {
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  MessageSquareText,
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
} from "@/components/screens/shared/schedule/schedule-utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { getMemberScheduleData } from "./member-schedule-data"

type MemberSchedulePageProps = {
  month?: string
}

export async function MemberSchedulePage({ month }: MemberSchedulePageProps) {
  const { year, monthIndex } = parseScheduleMonth(month)
  const selectedMonth = new Date(year, monthIndex, 1)
  const previousMonth = new Date(year, monthIndex - 1, 1)
  const nextMonth = new Date(year, monthIndex + 1, 1)
  const calendarWeeks = buildScheduleCalendarWeeks(year, monthIndex)
  const { error, feedbacks, sessions } = await getMemberScheduleData()
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
  const feedbackReceivedCount = monthSessions.filter((session) =>
    feedbackBySession.has(session.id)
  ).length

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
                title: "PT feedback",
                description: "Feedback received this month",
                value: feedbackReceivedCount,
                icon: MessageSquareText,
              },
            ]}
          />

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

          <ScheduleCalendarCard
            calendarWeeks={calendarWeeks}
            description="Click a session to view details and trainer feedback."
            feedbackBySession={feedbackBySession}
            nextMonth={nextMonth}
            participantFallback="Trainer"
            previousMonth={previousMonth}
            selectedMonth={selectedMonth}
            sessionsByDay={sessionsByDay}
          />
        </>
      ) : (
        <ScheduleEmptyState description="Sessions are generated after a PT assignment is accepted and the subscription is paid." />
      )}
    </PageShell>
  )
}
