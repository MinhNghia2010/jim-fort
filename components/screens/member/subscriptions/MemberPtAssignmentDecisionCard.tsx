import { Check, X } from "lucide-react"

import { decidePtAssignment } from "@/app/(main)/member-actions"
import { MemberActionForm } from "@/components/screens/member/MemberActionForm"
import { subscriptionWeekdays } from "@/lib/features/shared/subscriptions/detail-utils"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import type {
  MemberAssignmentRow,
  MemberSubscriptionRow,
} from "@/lib/features/member/subscriptions/detail-data"

type MemberPtAssignmentDecisionCardProps = {
  assignment: MemberAssignmentRow
  subscription: MemberSubscriptionRow
}

export function MemberPtAssignmentDecisionCard({
  assignment,
  subscription,
}: MemberPtAssignmentDecisionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PT assignment decision</CardTitle>
        <CardDescription>
          Review the proposed trainer and weekly schedule.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="rounded-lg border p-3">
          <p className="font-medium">
            {assignment.users?.full_name ?? "Trainer"}
          </p>
          <p className="text-sm text-muted-foreground">
            {assignment.schedule_note ?? "No manager note"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {assignment.membership_pt_assignment_schedule_slots?.map((slot) => (
              <Badge key={`${slot.day_of_week}-${slot.start_time}`} variant="secondary">
                {subscriptionWeekdays[slot.day_of_week]}{" "}
                {slot.start_time.slice(0, 5)}-{slot.end_time.slice(0, 5)}
              </Badge>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <MemberActionForm
            action={decidePtAssignment}
            submitLabel="Accept assignment"
          >
            <input type="hidden" name="subscriptionId" value={subscription.id} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <input type="hidden" name="decision" value="accepted" />
            <input type="hidden" name="note" value="Accepted" />
            <Check data-icon="inline-start" />
          </MemberActionForm>
          <MemberActionForm
            action={decidePtAssignment}
            submitLabel="Reject assignment"
            buttonVariant="outline"
          >
            <input type="hidden" name="subscriptionId" value={subscription.id} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <input type="hidden" name="decision" value="rejected" />
            <Input name="note" placeholder="Reason or new preference" />
            <X data-icon="inline-start" />
          </MemberActionForm>
        </div>
      </CardContent>
    </Card>
  )
}
