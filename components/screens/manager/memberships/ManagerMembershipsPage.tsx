import { OwnerMembershipsContent } from "@/components/screens/owner/memberships/OwnerMembershipsPage"
import { getMembershipsPageData } from "@/app/(main)/memberships/data"

export async function ManagerMembershipsPage() {
  const membershipsPageProps = await getMembershipsPageData()

  return <OwnerMembershipsContent {...membershipsPageProps} canManage={false} />
}
