import { getOwnerStaffPageData } from "@/app/(main)/staffs/data"
import { OwnerStaffClientContent } from "@/components/screens/owner/staffs/OwnerStaffClientContent"
import type { StaffTableRow } from "@/components/screens/owner/staffs/StaffTable"

interface OwnerStaffContentProps {
  staffs: StaffTableRow[]
  canAddStaff?: boolean
  canDeleteStaff?: boolean
}

export function OwnerStaffContent({
  staffs,
  canAddStaff = false,
  canDeleteStaff = false,
}: OwnerStaffContentProps) {
  return (
    <OwnerStaffClientContent
      staffs={staffs}
      canAddStaff={canAddStaff}
      canDeleteStaff={canDeleteStaff}
    />
  )
}

export async function OwnerStaffPage() {
  const staffs = await getOwnerStaffPageData()

  return <OwnerStaffContent staffs={staffs} canAddStaff canDeleteStaff />
}
