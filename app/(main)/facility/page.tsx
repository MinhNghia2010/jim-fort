import { OwnerFacilityPage } from "@/components/screens/owner/facility/OwnerFacilityPage"
import { ManagerFacilityPage } from "@/components/screens/manager/facility/ManagerFacilityPage"
import { redirect } from "next/navigation"
import { getAuthenticatedRole } from "@/lib/auth/current-role"
import { getAuthenticatedUser } from "@/lib/auth/current-user"
import { renderRolePage } from "@/lib/role-page"
import { createClient } from "@/lib/supabase/server"

import { getFacilityHref } from "./data"

export default async function FacilityIndexPage() {
  const role = await getAuthenticatedRole()
  const user = await getAuthenticatedUser()

  if (role === "owner" || role === "manager") {
    const supabase = await createClient()
    let facilityName: string | null = null

    if (role === "manager") {
      const { data: managerData } = await supabase
        .from("facility_managers")
        .select("facility_id")
        .eq("manager_id", user.id)
        .limit(1)
        .maybeSingle()
      
      if (managerData?.facility_id) {
        const { data: facilityData } = await supabase
          .from("gym_facilities")
          .select("name")
          .eq("id", managerData.facility_id)
          .single()
        
        facilityName = facilityData?.name ?? null
      }
    } else if (role === "owner") {
      const { data } = await supabase
        .from("gym_facilities")
        .select("name")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle()
      
      facilityName = data?.name ?? null
    }

    if (facilityName) {
      redirect(getFacilityHref(facilityName.trim()))
    }
  }

  return renderRolePage(role, {
    owner: <OwnerFacilityPage />,
    manager: <ManagerFacilityPage />,
  })
}
