import { OwnerRevenuePage } from "@/components/screens/owner/revenue/OwnerRevenuePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function RevenuePage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerRevenuePage />,
  })
}
