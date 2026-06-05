"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Dumbbell, LogOut } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  getNavItemsForRole,
  isNavItemActive,
  roleLabels,
  type NavItem,
  type Role,
} from "@/lib/nav-items"

export type AppSidebarUser = {
  name: string
  email: string
  facilityName?: string
  initials: string
  role: Role
  username: string
}

interface AppSidebarProps {
  user: AppSidebarUser
  signOutAction: () => Promise<void>
}

function SidebarNavItem({
  item,
  pathname,
}: {
  item: NavItem
  pathname: string
}) {
  const Icon = item.icon
  const isActive = isNavItemActive(pathname, item)

  return (
    <SidebarMenuItem>
      {item.href ? (
        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
          <Link href={item.href}>
            {Icon ? <Icon /> : null}
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      ) : (
        <SidebarMenuButton isActive={isActive} tooltip={item.title}>
          {Icon ? <Icon /> : null}
          <span>{item.title}</span>
        </SidebarMenuButton>
      )}

      {item.children?.length ? (
        <SidebarMenuSub>
          {item.children?.map((child) => {
            const ChildIcon = child.icon

            return (
              <SidebarMenuSubItem key={child.title}>
                <SidebarMenuSubButton
                  asChild={Boolean(child.href)}
                  isActive={isNavItemActive(pathname, child)}
                >
                  {child.href ? (
                    <Link href={child.href}>
                      {ChildIcon ? <ChildIcon /> : null}
                      <span>{child.title}</span>
                    </Link>
                  ) : (
                    <span>
                      {ChildIcon ? <ChildIcon /> : null}
                      <span>{child.title}</span>
                    </span>
                  )}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            )
          })}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}

export function AppSidebar({ user, signOutAction }: AppSidebarProps) {
  const pathname = usePathname()
  const profileHref = `/profile/${user.username}`
  const navItems = getNavItemsForRole(user.role, {
    facilityName: user.facilityName,
    username: user.username,
  })

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Link href="/overview">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Dumbbell />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Jim Fort</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Gym management
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarNavItem
                  key={item.title}
                  item={item}
                  pathname={pathname}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              isActive={pathname === profileHref}
              tooltip={user.email}
            >
              <Link href={profileHref}>
                <Avatar size="sm" className="rounded-full">
                  <AvatarFallback className="rounded-full bg-primary text-primary-foreground">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {roleLabels[user.role]}
                </Badge>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <form action={signOutAction}>
              <SidebarMenuButton asChild tooltip="Sign out">
                <button type="submit">
                  <LogOut />
                  <span>Sign out</span>
                </button>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
