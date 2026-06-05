import { notFound } from "next/navigation"

import { updateVoucher } from "@/app/(main)/vouchers/actions"
import { getVoucherEditFormData } from "@/app/(main)/vouchers/data"
import { VoucherForm } from "@/components/screens/owner/vouchers/form/VoucherForm"

interface OwnerEditVoucherPageProps {
  selectedVoucherCode?: string
}

export async function OwnerEditVoucherPage({
  selectedVoucherCode,
}: OwnerEditVoucherPageProps) {
  if (!selectedVoucherCode) {
    notFound()
  }

  const formData = await getVoucherEditFormData(selectedVoucherCode)

  if (!formData) {
    notFound()
  }

  return <VoucherForm mode="edit" data={formData} action={updateVoucher} />
}
