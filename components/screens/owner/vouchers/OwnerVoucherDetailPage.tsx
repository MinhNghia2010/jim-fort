import {
  BadgePercent,
  CircleDollarSign,
  History,
  SearchX,
  Pencil,
  Tag,
  TicketCheck,
} from "lucide-react"
import Link from "next/link"

import { getVoucherDetailData } from "@/app/(main)/vouchers/data"
import { PageShell } from "@/components/PageShell"
import { StatusBadge } from "@/components/StatusBadge"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { OwnerVoucherRedemptionsTable } from "@/components/screens/owner/vouchers/OwnerVoucherRedemptionsTable"
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
import { Progress } from "@/components/ui/progress"
import { isPastOrCurrentActivityDate } from "@/lib/features/shared/activity-history"
import type { VoucherView } from "@/components/screens/owner/vouchers/OwnerVouchersPage"

export interface VoucherDetailView extends VoucherView {
  createdAt: string | null
  updatedAt: string | null
  createdAtLabel: string
  updatedAtLabel: string
  discountImpactLabel: string
}

export interface VoucherRedemptionView {
  id: string
  memberName: string
  membershipPlanName: string
  discountAmount: number
  discountAmountLabel: string
  redeemedAt: string | null
  redeemedAtLabel: string
}

export interface OwnerVoucherDetailPageProps {
  facilityLabel: string
  voucher: VoucherDetailView
  redemptions: readonly VoucherRedemptionView[]
  errorMessage?: string
  canManage?: boolean
}

interface OwnerVoucherDetailPageRouteProps {
  voucherCode: string
  canManage?: boolean
}

function VoucherNotFoundContent({
  voucherCode,
}: OwnerVoucherDetailPageRouteProps) {
  return (
    <PageShell
      backHref="/vouchers"
      title="Voucher not found"
      description="This voucher could not be found from the current live voucher data."
    >
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SearchX className="size-5 text-muted-foreground" />
            No matching voucher
          </CardTitle>
          <CardDescription>
            The route was matched, but no voucher code matched{" "}
            <span className="font-mono text-foreground">{voucherCode}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/vouchers">Return to voucher list</Link>
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  )
}

type VoucherActivity = {
  id: string
  title: string
  detail: string
  at: string | null
  label: string
}

function getVoucherActivity(
  voucher: VoucherDetailView,
  redemptions: readonly VoucherRedemptionView[],
  now = new Date()
) {
  const activity: VoucherActivity[] = [
    {
      id: "created",
      title: "Voucher created",
      detail: voucher.discountLabel,
      at: voucher.createdAt,
      label: voucher.createdAtLabel,
    },
    {
      id: "updated",
      title: "Voucher updated",
      detail: `Status: ${voucher.status}`,
      at: voucher.updatedAt,
      label: voucher.updatedAtLabel,
    },
    {
      id: "starts",
      title: "Voucher starts",
      detail: "First eligible redemption date",
      at: voucher.startsAt,
      label: voucher.startsAtLabel,
    },
    {
      id: "expires",
      title: "Voucher expires",
      detail: "Last eligible redemption date",
      at: voucher.expiresAt,
      label: voucher.expiresAtLabel,
    },
    ...redemptions.map((redemption) => ({
      id: `redemption-${redemption.id}`,
      title: "Voucher redeemed",
      detail: `${redemption.memberName} · ${redemption.discountAmountLabel}`,
      at: redemption.redeemedAt,
      label: redemption.redeemedAtLabel,
    })),
  ]

  return activity
    .filter(
      (item) =>
        item.label !== "Not recorded" &&
        isPastOrCurrentActivityDate(item.at, now)
    )
    .sort((first, second) =>
      (second.at ?? "").localeCompare(first.at ?? "")
    )
}

function VoucherDetailContent({
  facilityLabel,
  voucher,
  redemptions,
  errorMessage,
  canManage = true,
}: OwnerVoucherDetailPageProps) {
  const activity = getVoucherActivity(voucher, redemptions)

  return (
    <PageShell
      backHref="/vouchers"
      eyebrow={facilityLabel}
      title={voucher.code}
      description="Voucher details, limits, dates, and redemption history."
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertTitle>Voucher details could not be fully loaded</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <ManagementMetricCard
          title="Discount"
          value={voucher.discountLabel}
          detail="Saved voucher discount"
          icon={Tag}
        />
        <ManagementMetricCard
          title="Usage"
          value={`${voucher.usage} / ${voucher.quantity}`}
          detail="Redemptions used"
          icon={TicketCheck}
        />
        <ManagementMetricCard
          title="Discount impact"
          value={voucher.discountImpactLabel}
          detail="Total redeemed discount"
          icon={CircleDollarSign}
        />
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Voucher summary</CardTitle>
          <CardDescription>
            Current voucher settings from the live vouchers table.
          </CardDescription>
          {canManage ? (
            <CardAction>
              <Button asChild size="sm" variant="outline">
                <Link
                  href={`/vouchers/edit?voucher=${encodeURIComponent(voucher.code)}`}
                >
                  <Pencil data-icon="inline-start" />
                  Edit voucher
                </Link>
              </Button>
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BadgePercent aria-hidden="true" className="size-4" />
                  Discount code
                </div>
                <StatusBadge status={voucher.status} showDot />
              </div>
              <p className="mt-3 font-mono text-2xl font-semibold tracking-tight">
                {voucher.code}
              </p>
              <p className="mt-1 text-sm font-medium">
                {voucher.discountLabel}
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Launch</span>
                <span className="font-mono text-xs">
                  {voucher.startsAtLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">End</span>
                <span className="font-mono text-xs">
                  {voucher.expiresAtLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="font-mono text-xs">
                  {voucher.createdAtLabel}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="font-mono text-xs">
                  {voucher.updatedAtLabel}
                </span>
              </div>
              <Progress
                aria-label={`${voucher.code} redemption usage`}
                value={Math.min(100, (voucher.usage / voucher.quantity) * 100)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            Activity history
          </CardTitle>
          <CardDescription>
            Creation, update, active window, and redemption events.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          {activity.length ? (
            <div className="divide-y">
              {activity.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-1 px-6 py-4 text-sm md:grid-cols-[minmax(0,1fr)_12rem] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{item.title}</p>
                    <p className="truncate text-muted-foreground">
                      {item.detail}
                    </p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground md:text-right">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No voucher activity is recorded yet.
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b py-4">
          <CardTitle>Redemption history</CardTitle>
          <CardDescription>
            Live records from voucher_redemptions.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <OwnerVoucherRedemptionsTable redemptions={redemptions} />
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerVoucherDetailPage({
  voucherCode,
  canManage = true,
}: OwnerVoucherDetailPageRouteProps) {
  const detailData = await getVoucherDetailData(voucherCode)

  if (!detailData) {
    return <VoucherNotFoundContent voucherCode={voucherCode} />
  }

  return <VoucherDetailContent {...detailData} canManage={canManage} />
}
