import { ManagerVoucherDetailPage } from "@/components/screens/manager/vouchers/ManagerVoucherDetailPage"
import { OwnerVoucherDetailPage } from "@/components/screens/owner/vouchers/OwnerVoucherDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface VoucherDetailPageProps {
  params: Promise<{
    voucherCode: string
  }>
}

export default async function VoucherDetailPage({
  params,
}: VoucherDetailPageProps) {
  const role = await getAuthenticatedRole()
  const { voucherCode } = await params

  return renderRolePage(role, {
    owner: <OwnerVoucherDetailPage voucherCode={voucherCode} />,
    manager: <ManagerVoucherDetailPage voucherCode={voucherCode} />,
  })
}
