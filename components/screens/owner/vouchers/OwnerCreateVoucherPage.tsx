import { createVoucher } from "@/app/(main)/vouchers/actions"
import { getVoucherFormData } from "@/app/(main)/vouchers/data"
import { VoucherForm } from "@/components/screens/owner/vouchers/form/VoucherForm"

export async function OwnerCreateVoucherPage() {
  const formData = await getVoucherFormData()

  return <VoucherForm data={formData} action={createVoucher} />
}
