import type { LucideIcon } from "lucide-react"
import {
  BadgePercent,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  MessageCircle,
  Ticket,
  UserCog,
  Users,
  ReceiptText,
  SquarePercent,
  FilePenLine,
} from "lucide-react"

import { roles } from "@/lib/routes"
import type { Role } from "@/lib/routes"

export type { Role } from "@/lib/routes"
export { isRole } from "@/lib/routes"

export type NavContext = {
  facilityName?: string
  username?: string
}

export type NavItem = {
  title: string
  href?: string
  icon?: LucideIcon
  roles: Role[]
  exact?: boolean
  children?: NavItem[]
}

type NavItemConfig = Omit<NavItem, "href" | "children"> & {
  href?: string | ((ctx: NavContext) => string)
  children?: NavItemConfig[]
}

export const roleLabels: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  pt: "PT",
  member: "Member",
}

const allRoles: Role[] = [...roles]

function getFacilityHref(ctx: NavContext) {
  const facilityName = ctx.facilityName?.trim()

  if (!facilityName) {
    return "/facility"
  }

  return `/facility/${encodeURIComponent(facilityName)}`
}

export const navItemConfigs: NavItemConfig[] = [
  {
    title: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
    roles: allRoles,
    exact: true,
  },
  {
    title: "Revenue",
    href: "/revenue",
    icon: CircleDollarSign,
    roles: ["owner"],
    exact: true,
  },
  {
    title: "Members",
    href: "/members",
    icon: Users,
    roles: ["owner", "manager"],
    exact: true,
  },
  {
    title: "My Clients",
    href: "/members",
    icon: Users,
    roles: ["pt"],
    exact: true,
  },
  {
    title: "Staffs",
    href: "/staffs",
    icon: UserCog,
    roles: ["owner", "manager"],
    exact: true,
  },
  {
    title: "Trainers",
    href: "/trainers",
    icon: Dumbbell,
    roles: ["member"],
    exact: true,
  },
  {
    title: "Schedule",
    href: "/schedule",
    icon: CalendarDays,
    roles: ["pt", "member"],
    exact: true,
  },
  {
    title: "Memberships & Vouchers",
    icon: SquarePercent,
    roles: ["owner", "manager"],
    children: [
      {
        title: "Memberships",
        href: "/memberships",
        icon: CreditCard,
        roles: ["owner", "manager"],
        exact: true,
      },
      {
        title: "Vouchers",
        href: "/vouchers",
        icon: Ticket,
        roles: ["owner", "manager"],
        exact: true,
      },
    ],
  },
  {
    title: "Membership Plans",
    href: "/memberships",
    icon: BadgePercent,
    roles: ["member"],
    exact: true,
  },
  {
    title: "Subscriptions",
    href: "/subscriptions",
    icon: ClipboardList,
    roles: ["manager", "member"],
    exact: true,
  },
  {
    title: "Requests",
    href: "/request",
    icon: FilePenLine,
    roles: ["manager"],
    exact: true,
  },
  {
    title: "Facility",
    href: getFacilityHref,
    icon: Building2,
    roles: ["owner", "manager"],
    exact: true,
  },
  {
    title: "Payments",
    href: "/payments",
    icon: ReceiptText,
    roles: ["member"],
    exact: true,
  },
  {
    title: "Feedback",
    href: "/feedback",
    icon: MessageCircle,
    roles: ["owner", "manager", "member"],
    exact: true,
  },
]

function resolveHref(
  href: NavItemConfig["href"],
  ctx: NavContext
): string | undefined {
  if (!href) {
    return undefined
  }

  if (typeof href === "function") {
    return href(ctx)
  }

  return href
}

function resolveNavItem(item: NavItemConfig, ctx: NavContext): NavItem {
  return {
    ...item,
    href: resolveHref(item.href, ctx),
    children: item.children?.map((child) => resolveNavItem(child, ctx)),
  }
}

function filterNavItemsByRole(
  items: NavItemConfig[],
  role: Role,
  ctx: NavContext
): NavItem[] {
  return items
    .filter((item) => item.roles.includes(role))
    .map((item) => {
      const filteredChildren = item.children
        ? filterNavItemsByRole(item.children, role, ctx)
        : undefined

      return resolveNavItem(
        {
          ...item,
          children: filteredChildren,
        },
        ctx
      )
    })
}

export function getNavItemsForRole(role: Role, ctx: NavContext = {}) {
  return filterNavItemsByRole(navItemConfigs, role, ctx)
}

export function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (item.children?.some((child) => isNavItemActive(pathname, child))) {
    return true
  }

  if (!item.href) {
    return false
  }

  if (item.exact) {
    return pathname === item.href
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}
