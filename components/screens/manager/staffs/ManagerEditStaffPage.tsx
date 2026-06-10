import { OwnerEditStaffPage } from "@/components/screens/owner/staffs/OwnerEditStaffPage"

interface ManagerEditStaffPageProps {
  staffId: string
}

export function ManagerEditStaffPage({ staffId }: ManagerEditStaffPageProps) {
  return <OwnerEditStaffPage staffId={staffId} />
}
