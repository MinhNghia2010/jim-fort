import { MemberPaymentDetailPage } from "@/components/screens/member/payments/MemberPaymentDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function PaymentDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberPaymentDetailPage />,
  })
}
