import { MemberSubscriptionDetailPage } from "@/components/screens/member/subscriptions/MemberSubscriptionDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { subscriptionId } = await params

  return renderRolePage(role, {
    member: <MemberSubscriptionDetailPage subscriptionId={subscriptionId} />,
  })
}
