import { OwnerRoomEquipmentPage } from "@/components/screens/owner/facility/OwnerRoomEquipmentPage"

interface ManagerRoomEquipmentPageProps {
  facilityName: string
  roomId: string
}

export function ManagerRoomEquipmentPage({
  facilityName,
  roomId,
}: ManagerRoomEquipmentPageProps) {
  return <OwnerRoomEquipmentPage facilityName={facilityName} roomId={roomId} />
}
