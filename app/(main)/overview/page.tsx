<<<<<<< HEAD
import { MemberOverviewPage } from "@/components/screens/member/overview/MemberOverviewPage"
import { OwnerOverview } from "@/components/screens/owner/overview/OwnerOverview"
import { getAuthenticatedRole } from "@/lib/auth/current-role"

export default async function OverviewPage() {
  const role = await getAuthenticatedRole()

  if (role === "member") {
    return <MemberOverviewPage />
  }

=======
import { OwnerOverview } from "@/components/screens/owner/overview/OwnerOverview"

export default function OverviewPage() {
>>>>>>> e3a4dbaba5182d183b9e8334e2e297b4e443febd
  return <OwnerOverview />
}
