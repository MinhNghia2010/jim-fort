import { OwnerCreateRoomPage } from "@/components/screens/owner/facility/OwnerCreateRoomPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface CreateFacilityRoomPageProps {
  params: Promise<{
    facilityName: string
  }>
}

export default async function CreateFacilityRoomPage({
  params,
}: CreateFacilityRoomPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName } = await params

  return renderRolePage(role, {
    owner: <OwnerCreateRoomPage facilityName={facilityName} />,
  })
}
