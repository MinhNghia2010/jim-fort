import { ManagerFacilityDetailPage } from "@/components/screens/manager/facility/ManagerFacilityDetailPage"
import { OwnerFacilityDetailPage } from "@/components/screens/owner/facility/OwnerFacilityDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FacilityPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerFacilityDetailPage />,
    manager: <ManagerFacilityDetailPage />,
  })
}
