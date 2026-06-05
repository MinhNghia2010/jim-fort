import { MemberTrainerDetailPage } from "@/components/screens/member/trainers/MemberTrainerDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function TrainerDetailPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberTrainerDetailPage />,
  })
}
