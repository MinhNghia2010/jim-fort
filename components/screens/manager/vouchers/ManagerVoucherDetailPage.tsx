import { OwnerVoucherDetailPage } from "@/components/screens/owner/vouchers/OwnerVoucherDetailPage"

interface ManagerVoucherDetailPageProps {
  voucherCode: string
}

export async function ManagerVoucherDetailPage({
  voucherCode,
}: ManagerVoucherDetailPageProps) {
  return <OwnerVoucherDetailPage voucherCode={voucherCode} canManage={false} />
}
