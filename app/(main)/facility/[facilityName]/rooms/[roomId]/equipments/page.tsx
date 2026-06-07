import { ManagerRoomEquipmentPage } from "@/components/screens/manager/facility/ManagerRoomEquipmentPage"
import { OwnerRoomEquipmentPage } from "@/components/screens/owner/facility/OwnerRoomEquipmentPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface FacilityRoomEquipmentPageProps {
  params: Promise<{
    facilityName: string
    roomId: string
  }>
  searchParams?: Promise<{
    category?: string | string[]
  }>
}

export default async function FacilityRoomEquipmentPage({
  params,
  searchParams,
}: FacilityRoomEquipmentPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName, roomId } = await params
  const resolvedSearchParams = await searchParams
  const category = Array.isArray(resolvedSearchParams?.category)
    ? resolvedSearchParams.category[0]
    : resolvedSearchParams?.category

  return renderRolePage(role, {
    owner: (
      <OwnerRoomEquipmentPage
        facilityName={facilityName}
        roomId={roomId}
        category={category}
      />
    ),
    manager: <ManagerRoomEquipmentPage />,
  })
}
