import { ManagerFacilityDetailPage } from "@/components/screens/manager/facility/ManagerFacilityDetailPage"
import { OwnerFacilityDetailPage } from "@/components/screens/owner/facility/OwnerFacilityDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface FacilityPageProps {
  params: Promise<{
    facilityName: string
  }>
}

export default async function FacilityPage({ params }: FacilityPageProps) {
  const role = await getAuthenticatedRole()
  const { facilityName } = await params

  return renderRolePage(role, {
    owner: <OwnerFacilityDetailPage facilityName={facilityName} />,
    manager: <ManagerFacilityDetailPage />,
  })
}
