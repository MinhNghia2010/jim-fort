import { OwnerMemberDetailPage } from "@/components/screens/owner/members/OwnerMemberDetailPage"

interface ManagerMemberDetailPageProps {
  memberId: string
}

export function ManagerMemberDetailPage({
  memberId,
}: ManagerMemberDetailPageProps) {
  return <OwnerMemberDetailPage memberId={memberId} viewerLabel="Manager" />
}
