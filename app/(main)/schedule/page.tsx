import { MemberSchedulePage } from "@/components/screens/member/schedule/MemberSchedulePage"
import { PtSchedulePage } from "@/components/screens/pt/schedule/PtSchedulePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function SchedulePage({
  searchParams,
}: {
  searchParams?: Promise<{ month?: string }>
}) {
  const role = await getAuthenticatedRole()
  const query = searchParams ? await searchParams : {}

  return renderRolePage(role, {
    member: <MemberSchedulePage />,
    pt: <PtSchedulePage month={query.month} />,
  })
}
