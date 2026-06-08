import { ManagerRequestDetailPage } from "@/components/screens/manager/requests/ManagerRequestDetailPage"
import { PtRequestDetailPage } from "@/components/screens/pt/requests/PtRequestDetailPage"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>
}) {
  const role = await getAuthenticatedRole()
  const { requestId } = await params

  return renderRolePage(role, {
    manager: <ManagerRequestDetailPage requestId={requestId} />,
    pt: <PtRequestDetailPage />,
  })
}
