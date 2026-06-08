import { ManagerRequestResponsePage } from "@/components/screens/manager/requests/ManagerRequestResponsePage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function RequestResponsePage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { requestId } = await params

  return renderRolePage(role, {
    manager: <ManagerRequestResponsePage requestId={requestId} />,
  })
}
