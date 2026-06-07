import { ManagerFacilityDetailPage } from "@/components/screens/manager/facility/ManagerFacilityDetailPage"
import { OwnerFacilityDetailPage } from "@/components/screens/owner/facility/OwnerFacilityDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

<<<<<<< HEAD
export default async function FacilityPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerFacilityDetailPage />,
=======
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
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
    manager: <ManagerFacilityDetailPage />,
  })
}
