import { ManagerFacilityRoomPage } from "@/components/screens/manager/facility/ManagerFacilityRoomPage"
import { OwnerFacilityRoomPage } from "@/components/screens/owner/facility/OwnerFacilityRoomPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FacilityRoomPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerFacilityRoomPage />,
    manager: <ManagerFacilityRoomPage />,
  })
}
