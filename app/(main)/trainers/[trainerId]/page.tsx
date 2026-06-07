import { MemberTrainerDetailPage } from "@/components/screens/member/trainers/MemberTrainerDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function TrainerDetailPage({
  params,
}: {
  params: Promise<{ trainerId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { trainerId } = await params

  return renderRolePage(role, {
    member: <MemberTrainerDetailPage trainerId={trainerId} />,
  })
}
