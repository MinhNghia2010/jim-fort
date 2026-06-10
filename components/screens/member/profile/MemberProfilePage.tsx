import { MemberCurrentMembershipCard } from "@/components/screens/member/profile/MemberCurrentMembershipCard"
import { ProfilePageContent } from "@/components/screens/shared/profile/ProfilePageContent"

export function MemberProfilePage() {
  return (
    <ProfilePageContent roleLabel="Member">
      <MemberCurrentMembershipCard />
    </ProfilePageContent>
  )
}
