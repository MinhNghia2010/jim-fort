import { OwnerEquipmentDetailPage } from "@/components/screens/owner/facility/OwnerEquipmentDetailPage"

interface ManagerEquipmentDetailPageProps {
  facilityName: string
  roomId: string
  equipmentId: string
}

export function ManagerEquipmentDetailPage({
  facilityName,
  roomId,
  equipmentId,
}: ManagerEquipmentDetailPageProps) {
  return (
    <OwnerEquipmentDetailPage
      facilityName={facilityName}
      roomId={roomId}
      equipmentId={equipmentId}
      canManageEquipment
    />
  )
}
