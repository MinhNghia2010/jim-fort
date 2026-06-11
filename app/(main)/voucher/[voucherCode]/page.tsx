import { redirect } from "next/navigation"

interface VoucherDetailPageProps {
  params: Promise<{
    voucherCode: string
  }>
}

export default async function VoucherDetailPage({
  params,
}: VoucherDetailPageProps) {
  const { voucherCode } = await params
  const normalizedVoucherCode = voucherCode.startsWith("view=")
    ? voucherCode.slice("view=".length)
    : voucherCode

  redirect(`/vouchers/${encodeURIComponent(normalizedVoucherCode)}`)
}
