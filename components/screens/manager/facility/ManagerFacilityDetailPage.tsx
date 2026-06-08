import { OwnerFacilityDetailPage } from "@/components/screens/owner/facility/OwnerFacilityDetailPage"

interface ManagerFacilityDetailPageProps {
  facilityName: string
}

export function ManagerFacilityDetailPage({
  facilityName,
}: ManagerFacilityDetailPageProps) {
  return <OwnerFacilityDetailPage facilityName={facilityName} />
}
