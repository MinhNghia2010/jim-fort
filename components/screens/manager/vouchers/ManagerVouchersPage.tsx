import { OwnerVouchersContent } from "@/components/screens/owner/vouchers/OwnerVouchersPage"
import { getVouchersPageData } from "@/app/(main)/vouchers/data"

export async function ManagerVouchersPage() {
  const vouchersPageProps = await getVouchersPageData()

  return <OwnerVouchersContent {...vouchersPageProps} canManage={false} />
}
