import { UserCheck, UserMinus, UserPlus, Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import {
  MembersTable,
  type MemberTableRow,
} from "@/components/screens/owner/members/MembersTable"
import { getMembersPageData } from "@/app/(main)/members/data"

interface OwnerMembersContentProps {
  members: MemberTableRow[]
  canAddMember?: boolean
}

function isCurrentMonth(value: string) {
  const date = new Date(value)
  const now = new Date()

  return (
    date.getUTCFullYear() === now.getUTCFullYear() &&
    date.getUTCMonth() === now.getUTCMonth()
  )
}

export function OwnerMembersContent({
  members,
  canAddMember = false,
}: OwnerMembersContentProps) {
  const activeMembers = members.filter(
    (member) => member.status === "active"
  ).length
  const newMembers = members.filter((member) =>
    isCurrentMonth(member.joinedAt)
  ).length
  const churnedMembers = members.filter(
    (member) => member.status === "expired" || member.status === "cancelled"
  ).length

  return (
    <PageShell title="Members" description="Manage and track all gym members.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Members"
          icon={Users}
          value={members.length}
        />
        <SummaryCard
          title="Active Members"
          icon={UserCheck}
          value={activeMembers}
        />
        <SummaryCard
          title="New This Month"
          icon={UserPlus}
          value={newMembers}
        />
        <SummaryCard title="Churned" icon={UserMinus} value={churnedMembers} />
      </div>

      <MembersTable members={members} canAddMember={canAddMember} />
    </PageShell>
  )
}

export async function OwnerMembersPage() {
  const members = await getMembersPageData()

  return <OwnerMembersContent members={members} />
}
