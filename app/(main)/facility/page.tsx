import { OwnerFacilityPage } from "@/components/screens/owner/facility/OwnerFacilityPage"
import { ManagerFacilityPage } from "@/components/screens/manager/facility/ManagerFacilityPage"
import { redirect } from "next/navigation"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { renderRolePage } from "@/lib/role-page"
import { createClient } from "@/lib/supabase/server"

import { getFacilityHref } from "./data"

export default async function FacilityIndexPage() {
  const role = await getAuthenticatedRole()

  if (role === "owner" || role === "manager") {
    const supabase = await createClient()
    const { data } = await supabase
      .from("gym_facilities")
      .select("name")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle()
    const facilityName =
      typeof data?.name === "string" ? data.name.trim() : null

    if (facilityName) {
      redirect(getFacilityHref(facilityName))
    }
  }

  return renderRolePage(role, {
    owner: <OwnerFacilityPage />,
    manager: <ManagerFacilityPage />,
  })
}
