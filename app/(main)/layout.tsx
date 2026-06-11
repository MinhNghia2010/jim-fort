import { Suspense, type ReactNode } from "react"

import { AppSidebar, type AppSidebarUser } from "@/components/AppSidebar"
import { NavigationHistoryTracker } from "@/components/NavigationHistoryTracker"
import { RedirectToast } from "@/components/RedirectToast"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getAuthenticatedUser } from "@/lib/auth/current-user"

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

export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const user = await getAuthenticatedUser()
  const role = user.role
  const email = user.email
  const name = user.fullName

  const sidebarUser: AppSidebarUser = {
    name,
    email,
    role,
    username: user.username,
    initials: getInitials(name, email),
  }

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh overflow-hidden">
        <AppSidebar user={sidebarUser} signOutAction={signOut} />
        <SidebarInset className="min-h-0 overflow-hidden">
          <NavigationHistoryTracker />
          <Suspense fallback={null}>
            <RedirectToast />
          </Suspense>
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
