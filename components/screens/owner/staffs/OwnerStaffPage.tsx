import { BriefcaseBusiness, UserCheck, UserCog, UserMinus } from "lucide-react"

import { PageShell } from "@/components/PageShell"
import { SummaryCard } from "@/components/SummaryCard"
import {
  StaffTable,
  type StaffTableRow,
} from "@/components/screens/owner/staffs/StaffTable"
import { getOwnerStaffPageData } from "@/app/(main)/staffs/data"

interface OwnerStaffContentProps {
  staffs: StaffTableRow[]
  canAddStaff?: boolean
}

export function OwnerStaffContent({
  staffs,
  canAddStaff = false,
}: OwnerStaffContentProps) {
  const activeStaffs = staffs.filter(
    (staff) => staff.status === "active"
  ).length
  const onLeaveStaffs = staffs.filter(
    (staff) => staff.status === "on_leave"
  ).length
  const roles = new Set(staffs.map((staff) => staff.role).filter(Boolean)).size

  return (
    <PageShell
      title="Staffs"
      description="Manage and track all facility staffs."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Staffs"
          icon={UserCog}
          value={staffs.length}
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

      <StaffTable staffs={staffs} canAddStaff={canAddStaff} />
    </PageShell>
  )
}

export async function OwnerStaffPage() {
  const staffs = await getOwnerStaffPageData()

  return <OwnerStaffContent staffs={staffs} canAddStaff />
}
