import { OwnerEditMembershipPage } from "@/components/screens/owner/memberships/OwnerEditMembershipPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

interface EditMembershipPageProps {
  searchParams?: Promise<{
    planId?: string | string[]
  }>
}

export default async function EditMembershipPage({
  searchParams,
}: EditMembershipPageProps) {
  const role = await getAuthenticatedRole()
  const resolvedSearchParams = await searchParams
  const selectedPlanId = Array.isArray(resolvedSearchParams?.planId)
    ? resolvedSearchParams.planId[0]
    : resolvedSearchParams?.planId

  return renderRolePage(role, {
    owner: <OwnerEditMembershipPage selectedPlanId={selectedPlanId} />,
  })
}
