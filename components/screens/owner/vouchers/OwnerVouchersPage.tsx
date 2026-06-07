import { CircleDollarSign, CirclePlus, Tag, TicketCheck } from "lucide-react"
import Link from "next/link"

import { getVouchersPageData } from "@/app/(main)/vouchers/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerVouchersTable } from "@/components/screens/owner/vouchers/OwnerVouchersTable"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

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
    <PageShell
      eyebrow={facilityLabel}
      title="Vouchers"
      description="Discount codes, launch windows, quantities, and redemption impact."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Voucher data could not be loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <ManagementMetricCard
          title="Available vouchers"
          value={activeVoucherCount}
          detail="Active and currently redeemable"
          icon={Tag}
        />
        <ManagementMetricCard
          title="Redemptions"
          value={redeemedVoucherCount}
          detail="Total voucher redemptions"
          icon={TicketCheck}
        />
        <ManagementMetricCard
          title="Discount impact"
          value={discountImpactLabel}
          detail="Total value from voucher redemptions"
          icon={CircleDollarSign}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Voucher codes</CardTitle>
          <CardDescription>
            Live records from vouchers and voucher_redemptions.
          </CardDescription>
          {canManage ? (
            <CardAction>
              <Button asChild size="sm">
                <Link href="/vouchers/create">
                  <CirclePlus data-icon="inline-start" />
                  Create voucher
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="px-0">
          <OwnerVouchersTable vouchers={vouchers} canManage={canManage} />
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerVouchersPage() {
  const vouchersPageProps = await getVouchersPageData()

  return <OwnerVouchersContent {...vouchersPageProps} />
}
