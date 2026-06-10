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
    owner: (
      <MemberPaymentDetailPage
        paymentId={paymentId}
        backHref="/revenue"
        viewerLabel="Owner"
        canOpenSubscription={false}
      />
    ),
    manager: (
      <MemberPaymentDetailPage
        paymentId={paymentId}
        backHref="/subscriptions"
        viewerLabel="Manager"
      />
    ),
    member: <MemberPaymentDetailPage paymentId={paymentId} />,
  })
}
