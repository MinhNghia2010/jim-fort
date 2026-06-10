"use client"

import { useState } from "react"
import { UserCheck, UserMinus, UserPlus, Users } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import {
  MembersTable,
  type MemberTableRow,
} from "@/components/screens/owner/members/MembersTable"
import {
  ALL_MONTHS_VALUE,
  matchesTableMonthFilter,
} from "@/components/TableMonthFilter"

interface OwnerMembersClientContentProps {
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

export function OwnerMembersClientContent({
  members,
  canAddMember = false,
}: OwnerMembersClientContentProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const summaryMembers =
    monthFilter === ALL_MONTHS_VALUE
      ? members
      : members.filter((member) =>
          matchesTableMonthFilter(member.joinedAt, monthFilter)
        )
  const activeMembers = summaryMembers.filter(
    (member) => member.status === "active"
  ).length
  const newMembers =
    monthFilter === ALL_MONTHS_VALUE
      ? members.filter((member) => isCurrentMonth(member.joinedAt)).length
      : summaryMembers.length
  const churnedMembers = summaryMembers.filter(
    (member) => member.status === "expired" || member.status === "cancelled"
  ).length

  return (
    <PageShell title="Members" description="Manage and track all gym members.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Members"
          icon={Users}
          value={summaryMembers.length}
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

      <MembersTable
        members={members}
        canAddMember={canAddMember}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
      />
    </PageShell>
  )
}
