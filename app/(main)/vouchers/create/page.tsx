import { OwnerCreateVoucherPage } from "@/components/screens/owner/vouchers/OwnerCreateVoucherPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function CreateVoucherPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerCreateVoucherPage />,
  })
}
