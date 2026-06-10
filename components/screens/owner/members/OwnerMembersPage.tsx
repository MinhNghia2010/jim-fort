import { getMembersPageData } from "@/app/(main)/members/data"
import { OwnerMembersClientContent } from "@/components/screens/owner/members/OwnerMembersClientContent"
import type { MemberTableRow } from "@/components/screens/owner/members/MembersTable"

interface OwnerMembersContentProps {
  members: MemberTableRow[]
  canAddMember?: boolean
  canEditMember?: boolean
  canDeleteMember?: boolean
}

export function OwnerMembersContent({
  members,
  canAddMember = false,
  canEditMember = false,
  canDeleteMember = false,
}: OwnerMembersContentProps) {
  return (
    <OwnerMembersClientContent
      members={members}
      canAddMember={canAddMember}
      canEditMember={canEditMember}
      canDeleteMember={canDeleteMember}
    />
  )
}

export async function OwnerMembersPage() {
  const members = await getMembersPageData()

  return (
    <OwnerMembersContent members={members} canEditMember canDeleteMember />
  )
}
