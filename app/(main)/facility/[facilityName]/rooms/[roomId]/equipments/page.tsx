import { ManagerRoomEquipmentPage } from "@/components/screens/manager/facility/ManagerRoomEquipmentPage"
import { OwnerRoomEquipmentPage } from "@/components/screens/owner/facility/OwnerRoomEquipmentPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

<<<<<<< HEAD
export default async function FacilityRoomEquipmentPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerRoomEquipmentPage />,
=======
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
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
    manager: <ManagerRoomEquipmentPage />,
  })
}
