import { OwnerMembersContent } from "@/components/screens/owner/members/OwnerMembersPage"
import { getMembersPageData } from "@/app/(main)/members/data"

export async function ManagerMembersPage() {
  const members = await getMembersPageData()

  return <OwnerMembersContent members={members} canAddMember />
}
