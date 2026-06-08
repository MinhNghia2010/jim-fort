import { OwnerFacilityRoomPage } from "@/components/screens/owner/facility/OwnerFacilityRoomPage"

interface ManagerFacilityRoomPageProps {
  facilityName: string
  roomId: string
}

export function ManagerFacilityRoomPage({
  facilityName,
  roomId,
}: ManagerFacilityRoomPageProps) {
  return <OwnerFacilityRoomPage facilityName={facilityName} roomId={roomId} />
}
