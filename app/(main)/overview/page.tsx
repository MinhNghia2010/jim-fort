import { MemberOverviewPage } from "@/components/screens/member/overview/MemberOverviewPage"
import { OwnerOverview } from "@/components/screens/owner/overview/OwnerOverview"
import { PtOverviewPage } from "@/components/screens/pt/overview/PtOverviewPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function OverviewPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    owner: <OwnerOverview />,
    manager: <OwnerOverview />,
    pt: <PtOverviewPage />,
    member: <MemberOverviewPage />,
  })
}
