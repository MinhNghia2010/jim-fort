import { MemberSubscriptionDetailPage } from "@/components/screens/member/subscriptions/MemberSubscriptionDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SubscriptionDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberSubscriptionDetailPage />,
  })
}
