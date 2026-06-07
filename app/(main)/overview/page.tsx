import { MemberOverviewPage } from "@/components/screens/member/overview/MemberOverviewPage"
import { OwnerOverview } from "@/components/screens/owner/overview/OwnerOverview"
import { getAuthenticatedRole } from "@/lib/auth/current-role"

export default async function OverviewPage() {
  const role = await getAuthenticatedRole()

  if (role === "member") {
    return <MemberOverviewPage />
  }

  return <OwnerOverview />
}
