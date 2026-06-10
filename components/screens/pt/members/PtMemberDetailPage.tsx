import { OwnerMemberDetailPage } from "@/components/screens/owner/members/OwnerMemberDetailPage"

interface PtMemberDetailPageProps {
  memberId: string
}

export function PtMemberDetailPage({ memberId }: PtMemberDetailPageProps) {
  return (
    <OwnerMemberDetailPage
      memberId={memberId}
      viewerLabel="PT client"
      showSessionsLink
    />
  )
}
