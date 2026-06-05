import { MemberPaymentsPage } from "@/components/screens/member/payments/MemberPaymentsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function PaymentsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberPaymentsPage />,
  })
}
