import { ManagerVouchersPage } from "@/components/screens/manager/vouchers/ManagerVouchersPage"
import { OwnerVouchersPage } from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function VouchersPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerVouchersPage />,
    manager: <ManagerVouchersPage />,
  })
}
