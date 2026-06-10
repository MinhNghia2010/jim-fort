import { getVouchersPageData } from "@/app/(main)/vouchers/data"
import { OwnerVouchersClientContent } from "@/components/screens/owner/vouchers/OwnerVouchersClientContent"

export type VoucherViewStatus =
  | "active"
  | "scheduled"
  | "redeemed"
  | "disabled"
  | "expired"

export interface VoucherView {
  code: string
  discountLabel: string
  usage: number
  quantity: number
  discountImpact: number
  startsAt: string | null
  startsAtLabel: string
  expiresAt: string | null
  expiresAtLabel: string
  status: VoucherViewStatus
}

export interface OwnerVouchersPageProps {
  facilityLabel: string
  vouchers: readonly VoucherView[]
  activeVoucherCount: number
  redeemedVoucherCount: number
  discountImpactLabel: string
  errorMessage?: string
  canManage?: boolean
}

export function OwnerVouchersContent({
  facilityLabel,
  vouchers,
  activeVoucherCount,
  redeemedVoucherCount,
  discountImpactLabel,
  errorMessage,
  canManage = true,
}: OwnerVouchersPageProps) {
  return (
    <OwnerVouchersClientContent
      facilityLabel={facilityLabel}
      vouchers={vouchers}
      activeVoucherCount={activeVoucherCount}
      redeemedVoucherCount={redeemedVoucherCount}
      discountImpactLabel={discountImpactLabel}
      errorMessage={errorMessage}
      canManage={canManage}
    />
  )
}

export async function OwnerVouchersPage() {
  const vouchersPageProps = await getVouchersPageData()

  return <OwnerVouchersContent {...vouchersPageProps} />
}
