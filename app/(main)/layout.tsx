import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AppSidebar, type AppSidebarUser } from "@/components/AppSidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { isRole } from "@/lib/nav-items"
import type { Role } from "@/lib/nav-items"
import { createClient } from "@/lib/supabase/server"

import { signOut } from "./actions"

function getInitials(name: string, email: string) {
  const source = name.trim() || email
  const parts = source.split(/\s+/).filter(Boolean).slice(0, 2)

  if (!parts.length) {
    return "JF"
  }

  return parts
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

function getUsername(email: string, metadataUsername: unknown) {
  if (typeof metadataUsername === "string" && metadataUsername.trim()) {
    return metadataUsername.trim()
  }

  return email.split("@")[0] || "profile"
}

type FacilityNameRow = {
  name: string | null
}

async function getPrimaryFacilityName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  role: Role
) {
  if (role !== "owner" && role !== "manager") {
    return undefined
  }

  const { data, error } = await supabase
    .from("gym_facilities")
    .select("name")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    return undefined
  }

  const facility = data as FacilityNameRow | null
  const facilityName = facility?.name?.trim()

  return facilityName || undefined
}

export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const role = isRole(user.app_metadata.app_role)
    ? user.app_metadata.app_role
    : "member"
  const email = user.email ?? ""
  const name =
    typeof user.user_metadata.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : email || "Gym User"

  const sidebarUser: AppSidebarUser = {
    name,
    email,
    facilityName: await getPrimaryFacilityName(supabase, role),
    role,
    username: getUsername(email, user.user_metadata.username),
    initials: getInitials(name, email),
  }

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar user={sidebarUser} signOutAction={signOut} />
        <SidebarInset className="min-h-0 overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-medium">
                {role.toUpperCase()} workspace
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {name}
              </span>
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
