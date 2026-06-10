"use client"

import { useState } from "react"
import { BriefcaseBusiness, UserCheck, UserCog, UserMinus } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import {
  StaffTable,
  type StaffTableRow,
} from "@/components/screens/owner/staffs/StaffTable"
import {
  ALL_MONTHS_VALUE,
  matchesTableMonthFilter,
} from "@/components/TableMonthFilter"

interface OwnerStaffClientContentProps {
  staffs: StaffTableRow[]
  canAddStaff?: boolean
  canDeleteStaff?: boolean
}

export function OwnerStaffClientContent({
  staffs,
  canAddStaff = false,
  canDeleteStaff = false,
}: OwnerStaffClientContentProps) {
  const [monthFilter, setMonthFilter] = useState(ALL_MONTHS_VALUE)
  const summaryStaffs =
    monthFilter === ALL_MONTHS_VALUE
      ? staffs
      : staffs.filter((staff) =>
          matchesTableMonthFilter(staff.hiredAt, monthFilter)
        )
  const activeStaffs = summaryStaffs.filter(
    (staff) => staff.status === "active"
  ).length
  const onLeaveStaffs = summaryStaffs.filter(
    (staff) => staff.status === "on_leave"
  ).length
  const roles = new Set(
    summaryStaffs.map((staff) => staff.role).filter(Boolean)
  ).size

  return (
    <PageShell
      title="Staffs"
      description="Manage and track all facility staffs."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Staffs"
          icon={UserCog}
          value={summaryStaffs.length}
        />
        <SummaryCard
          title="Active Staffs"
          icon={UserCheck}
          value={activeStaffs}
        />
        <SummaryCard title="On Leave" icon={UserMinus} value={onLeaveStaffs} />
        <SummaryCard
          title="Staff Roles"
          icon={BriefcaseBusiness}
          value={roles}
        />
      </div>

      <StaffTable
        staffs={staffs}
        canAddStaff={canAddStaff}
        canDeleteStaff={canDeleteStaff}
        monthFilter={monthFilter}
        onMonthFilterChange={setMonthFilter}
      />
    </PageShell>
  )
}
