import { OwnerStaffContent } from "@/components/screens/owner/staffs/OwnerStaffPage"
import { getManagerStaffPageData } from "@/app/(main)/staffs/data"

export async function ManagerStaffPage() {
  const staffs = await getManagerStaffPageData()

  return <OwnerStaffContent staffs={staffs} canAddStaff />
}
