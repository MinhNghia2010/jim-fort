import { ManagerRequestDetailPage } from "@/components/screens/manager/requests/ManagerRequestDetailPage"
import { PtRequestDetailPage } from "@/components/screens/pt/requests/PtRequestDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function RequestDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    manager: <ManagerRequestDetailPage />,
    pt: <PtRequestDetailPage />,
  })
}
