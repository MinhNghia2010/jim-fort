import { MemberPaymentDetailPage } from "@/components/screens/member/payments/MemberPaymentDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ paymentId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { paymentId } = await params

  return renderRolePage(role, {
    member: <MemberPaymentDetailPage paymentId={paymentId} />,
  })
}
