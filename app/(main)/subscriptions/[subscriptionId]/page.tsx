import { MemberSubscriptionDetailPage } from "@/components/screens/member/subscriptions/MemberSubscriptionDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

<<<<<<< HEAD
export default async function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ subscriptionId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { subscriptionId } = await params

  return renderRolePage(role, {
    member: <MemberSubscriptionDetailPage subscriptionId={subscriptionId} />,
=======
export default async function SubscriptionDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberSubscriptionDetailPage />,
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
  })
}
