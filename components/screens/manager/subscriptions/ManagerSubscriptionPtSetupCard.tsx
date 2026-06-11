import { StatusBadge } from "@/components/StatusBadge"
import { SubscriptionDetailRow } from "@/components/screens/shared/subscriptions/SubscriptionInfoRows"
import {
  formatSubscriptionDate,
  formatSubscriptionLabel,
  formatSubscriptionSlot,
  getSingleRelation,
  sortSubscriptionSlots,
} from "@/lib/features/shared/subscriptions/detail-utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

import type {
  AssignmentRow,
  PreferenceRow,
} from "@/lib/features/manager/subscriptions/detail-data"

type ManagerSubscriptionPtSetupCardProps = {
  assignments: AssignmentRow[]
  preference: PreferenceRow | null
}

export function ManagerSubscriptionPtSetupCard({
  assignments,
  preference,
}: ManagerSubscriptionPtSetupCardProps) {
  const preferredPt = getSingleRelation(preference?.preferred_pt)
  const preferenceSlots = sortSubscriptionSlots(
    preference?.membership_pt_preference_time_slots
  )

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>PT setup</CardTitle>
        <CardDescription>
          Member preferences and trainer assignment history.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        {preference ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <SubscriptionDetailRow
              label="Weekly sessions"
              value={String(preference.sessions_per_week)}
            />
            <SubscriptionDetailRow
              label="Preferred PT"
              value={preferredPt?.full_name ?? "No preference"}
            />
            <SubscriptionDetailRow
              label="PT gender"
              value={formatSubscriptionLabel(preference.preferred_pt_gender)}
            />
            <SubscriptionDetailRow
              label="Experience"
              value={formatSubscriptionLabel(preference.experience_level)}
            />
            <SubscriptionDetailRow
              label="Goal"
              value={preference.training_goal ?? "Not recorded"}
            />
            <SubscriptionDetailRow
              label="Notes"
              value={preference.notes ?? "Not recorded"}
            />
            <div className="sm:col-span-2">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Member availability
              </p>
              {preferenceSlots.length ? (
                <div className="flex flex-wrap gap-2">
                  {preferenceSlots.map((slot) => (
                    <Badge key={formatSubscriptionSlot(slot)} variant="secondary">
                      {formatSubscriptionSlot(slot)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No availability slots saved.
                </p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No PT preferences have been submitted for this subscription.
          </p>
        )}

        <Separator />

        <div className="grid gap-3">
          <h3 className="font-medium">Assignment history</h3>
          {assignments.length ? (
            assignments.map((assignment) => (
              <ManagerSubscriptionAssignmentCard
                assignment={assignment}
                key={assignment.id}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No trainer assignment has been proposed.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type ManagerSubscriptionAssignmentCardProps = {
  assignment: AssignmentRow
}

function ManagerSubscriptionAssignmentCard({
  assignment,
}: ManagerSubscriptionAssignmentCardProps) {
  const trainer = getSingleRelation(assignment.users)
  const assignmentSlots = sortSubscriptionSlots(
    assignment.membership_pt_assignment_schedule_slots
  )

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-medium">{trainer?.full_name ?? "Trainer"}</p>
          <p className="text-sm text-muted-foreground">
            Assigned {formatSubscriptionDate(assignment.assigned_at)}
          </p>
        </div>
        <StatusBadge status={assignment.status} showDot />
      </div>
      {assignment.schedule_note ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {assignment.schedule_note}
        </p>
      ) : null}
      {assignment.member_response_note ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Member note: {assignment.member_response_note}
        </p>
      ) : null}
      {assignmentSlots.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {assignmentSlots.map((slot) => (
            <Badge key={formatSubscriptionSlot(slot)} variant="outline">
              {formatSubscriptionSlot(slot)}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
