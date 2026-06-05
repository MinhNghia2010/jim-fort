import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import type { Role } from "@/lib/routes"

type RolePageMap = Partial<Record<Role, ReactNode>>

export function renderRolePage(role: Role, pages: RolePageMap) {
  const page = pages[role]

  if (page) {
    return page
  }

  redirect("/unauthorized")
}
