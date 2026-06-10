import { OwnerStaffDetailPage } from "@/components/screens/owner/staffs/OwnerStaffDetailPage"

interface ManagerStaffDetailPageProps {
  staffId: string
}

export function ManagerStaffDetailPage({
  staffId,
}: ManagerStaffDetailPageProps) {
  return <OwnerStaffDetailPage staffId={staffId} canDelete={false} />
}
