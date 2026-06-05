import { OwnerFacilityPage } from "@/components/screens/owner/facility/OwnerFacilityPage"
import { ManagerFacilityPage } from "@/components/screens/manager/facility/ManagerFacilityPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function FacilityIndexPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerFacilityPage />,
    manager: <ManagerFacilityPage />,
  })
}
