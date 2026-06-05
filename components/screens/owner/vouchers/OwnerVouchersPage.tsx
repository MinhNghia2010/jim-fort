import {
  BadgePercent,
  CircleDollarSign,
  CirclePlus,
  MoreHorizontal,
  Tag,
  TicketCheck,
} from "lucide-react"
import Link from "next/link"

import { getVouchersPageData } from "@/app/(main)/vouchers/data"
import { PageShell } from "@/components/PageShell"
import { ManagementMetricCard } from "@/components/screens/owner/ManagementMetricCard"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

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
  startsAtLabel: string
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

function voucherStatusVariant(status: VoucherViewStatus) {
  if (status === "active") {
    return "default" as const
  }

  if (status === "expired") {
    return "destructive" as const
  }

  if (status === "disabled" || status === "scheduled") {
    return "outline" as const
  }

  return "secondary" as const
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
          {vouchers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="px-4">Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Starts</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="pr-4 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchers.map((voucher) => (
                  <TableRow key={voucher.code}>
                    <TableCell className="px-4">
                      <div className="flex items-center gap-2">
                        <BadgePercent
                          aria-hidden="true"
                          className="size-4 text-primary"
                        />
                        <span className="font-mono font-medium">
                          {voucher.code}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {voucher.discountLabel}
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-28 items-center gap-2">
                        <span className="font-mono text-xs tabular-nums">
                          {voucher.usage} / {voucher.quantity}
                        </span>
                        <Progress
                          aria-label={`${voucher.code} usage`}
                          value={Math.min(
                            100,
                            (voucher.usage / voucher.quantity) * 100
                          )}
                          className="max-w-16"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {voucher.startsAtLabel}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {voucher.expiresAtLabel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={voucherStatusVariant(voucher.status)}
                        className="capitalize"
                      >
                        {voucher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Open actions for ${voucher.code}`}
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/voucher/view=${encodeURIComponent(voucher.code)}`}
                              >
                                View details
                              </Link>
                            </DropdownMenuItem>
                            {canManage ? (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/vouchers/edit?voucher=${encodeURIComponent(voucher.code)}`}
                                >
                                  Edit voucher
                                </Link>
                              </DropdownMenuItem>
                            ) : null}
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Empty className="min-h-64 rounded-none border-0">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Tag />
                </EmptyMedia>
                <EmptyTitle>No vouchers yet</EmptyTitle>
                <EmptyDescription>
                  The live vouchers table is empty. Create a code with launch
                  and end dates to start tracking redemptions.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardContent>
      </Card>
    </PageShell>
  )
}

export async function OwnerVouchersPage() {
  const vouchersPageProps = await getVouchersPageData()

  return <OwnerVouchersContent {...vouchersPageProps} />
}
