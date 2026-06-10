import { ManagerCreateMemberPage } from "@/components/screens/manager/members/ManagerCreateMemberPage"
import { getManagerCreateMemberPageData } from "@/app/(main)/members/data"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function CreateMemberPage() {
  const role = await getAuthenticatedRole()
  const planOptions =
    role === "manager" ? await getManagerCreateMemberPageData() : []

  return renderRolePage(role, {
    manager: <ManagerCreateMemberPage planOptions={planOptions} />,
  })
}
