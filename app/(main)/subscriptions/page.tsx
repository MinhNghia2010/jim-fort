import { ManagerSubscriptionsPage } from "@/components/screens/manager/subscriptions/ManagerSubscriptionsPage"
import { MemberSubscriptionsPage } from "@/components/screens/member/subscriptions/MemberSubscriptionsPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SubscriptionsPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    manager: <ManagerSubscriptionsPage />,
    member: <MemberSubscriptionsPage />,
  })
}
