import { UserCheck } from "lucide-react"

import { StatusBadge } from "@/components/StatusBadge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import type { MemberAssignmentRow } from "./member-subscription-detail-data"

type MemberAcceptedPtCardProps = {
  assignment: MemberAssignmentRow
}

export function MemberAcceptedPtCard({ assignment }: MemberAcceptedPtCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accepted PT</CardTitle>
        <CardDescription>
          {assignment.users?.full_name ?? "Trainer"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StatusBadge status={assignment.status} showDot>
          <UserCheck data-icon="inline-start" />
          Ready for payment
        </StatusBadge>
      </CardContent>
    </Card>
  )
}
