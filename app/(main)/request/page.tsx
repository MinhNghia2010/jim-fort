import { ManagerRequestsPage } from "@/components/screens/manager/requests/ManagerRequestsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function RequestsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    manager: <ManagerRequestsPage />,
  })
}
