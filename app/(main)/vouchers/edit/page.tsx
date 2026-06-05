import { OwnerEditVoucherPage } from "@/components/screens/owner/vouchers/OwnerEditVoucherPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface EditVoucherPageProps {
  searchParams?: Promise<{
    voucher?: string | string[]
  }>
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function EditVoucherPage({
  searchParams,
}: EditVoucherPageProps) {
  const role = await getAuthenticatedRole()
  const resolvedSearchParams = await searchParams
  const selectedVoucherCode = getSearchParam(resolvedSearchParams?.voucher)

  return renderRolePage(role, {
    owner: <OwnerEditVoucherPage selectedVoucherCode={selectedVoucherCode} />,
  })
}
