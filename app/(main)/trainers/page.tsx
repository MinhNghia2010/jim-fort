import { MemberTrainersPage } from "@/components/screens/member/trainers/MemberTrainersPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function TrainersPage() {
  const role = await getAuthenticatedRole()

  return renderRolePage(role, {
    member: <MemberTrainersPage />,
  })
}
