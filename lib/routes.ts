export const roles = ["owner", "manager", "pt", "member"] as const

export type Role = (typeof roles)[number]

export type RouteAccessRule = {
  label: string
  path: string
  roles: readonly Role[]
}

const allRoles: readonly Role[] = roles

export function isRole(role: unknown): role is Role {
  return typeof role === "string" && roles.includes(role as Role)
}

export const appRoutes = [
  {
    label: "Overview",
    path: "/overview",
    roles: allRoles,
  },
  {
    label: "Unauthorized",
    path: "/unauthorized",
    roles: allRoles,
  },
  {
    label: "Revenue",
    path: "/revenue",
    roles: ["owner"],
  },
  {
    label: "Members",
    path: "/members",
    roles: ["owner", "manager", "pt"],
  },
  {
    label: "Create Member",
    path: "/members/create",
    roles: ["manager"],
  },
  {
    label: "Member Detail",
    path: "/members/[memberId]",
    roles: ["owner", "manager", "pt"],
  },
  {
    label: "Member Sessions",
    path: "/members/[memberId]/sessions",
    roles: ["pt"],
  },
  {
    label: "Staffs",
    path: "/staffs",
    roles: ["owner", "manager"],
  },
  {
    label: "Add Staff",
    path: "/staffs/add",
    roles: ["owner", "manager"],
  },
  {
    label: "Staff Detail",
    path: "/staffs/[staffId]",
    roles: ["owner", "manager"],
  },
  {
    label: "Edit Staff",
    path: "/staffs/[staffId]/edit",
    roles: ["owner", "manager"],
  },
  {
    label: "Memberships",
    path: "/memberships",
    roles: ["owner", "manager", "member"],
  },
  {
    label: "Create Membership",
    path: "/memberships/create",
    roles: ["owner"],
  },
  {
    label: "Edit Membership",
    path: "/memberships/edit",
    roles: ["owner"],
  },
  {
    label: "Vouchers",
    path: "/vouchers",
    roles: ["owner", "manager"],
  },
  {
    label: "Create Voucher",
    path: "/vouchers/create",
    roles: ["owner"],
  },
  {
    label: "Edit Voucher",
    path: "/vouchers/edit",
    roles: ["owner"],
  },
  {
    label: "Voucher Detail",
    path: "/voucher/[voucherCode]",
    roles: ["owner", "manager"],
  },
  {
    label: "Subscriptions",
    path: "/subscriptions",
    roles: ["manager", "member"],
  },
  {
    label: "Subscription Detail",
    path: "/subscriptions/[subscriptionId]",
    roles: ["member"],
  },
  {
    label: "Requests",
    path: "/request",
    roles: ["manager", "pt"],
  },
  {
    label: "Request Detail",
    path: "/request/[requestId]",
    roles: ["manager", "pt"],
  },
  {
    label: "Facility",
    path: "/facility",
    roles: ["owner", "manager"],
  },
  {
    label: "Facility Detail",
    path: "/facility/[facilityName]",
    roles: ["owner", "manager"],
  },
  {
    label: "Facility Room",
    path: "/facility/[facilityName]/rooms/[roomId]",
    roles: ["owner", "manager"],
  },
  {
    label: "Facility Room Equipments",
    path: "/facility/[facilityName]/rooms/[roomId]/equipments",
    roles: ["owner", "manager"],
  },
  {
    label: "Equipment Detail",
    path: "/facility/[facilityName]/rooms/[roomId]/equipments/[equipmentId]",
    roles: ["owner", "manager"],
  },
  {
    label: "Schedule",
    path: "/schedule",
    roles: ["pt", "member"],
  },
  {
    label: "Schedule Session",
    path: "/schedule/sessions/[sessionsId]",
    roles: ["pt", "member"],
  },
  {
    label: "Session Feedback",
    path: "/schedule/sessions/[sessionsId]/feedback",
    roles: ["member"],
  },
  {
    label: "Trainers",
    path: "/trainers",
    roles: ["member"],
  },
  {
    label: "Trainer Detail",
    path: "/trainers/[trainerId]",
    roles: ["member"],
  },
  {
    label: "Payments",
    path: "/payments",
    roles: ["member"],
  },
  {
    label: "Payment Detail",
    path: "/payments/[paymentId]",
    roles: ["member"],
  },
  {
    label: "Feedback",
    path: "/feedback",
    roles: ["owner", "manager", "member"],
  },
  {
    label: "Feedback Detail",
    path: "/feedback/[feedbackId]",
    roles: ["owner", "manager"],
  },
  {
    label: "Profile",
    path: "/profile/[username]",
    roles: allRoles,
  },
  {
    label: "Edit Profile",
    path: "/profile/[username]/edit",
    roles: allRoles,
  },
] as const satisfies readonly RouteAccessRule[]

export const defaultProtectedRoute = "/overview"

function normalizePathname(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

function isDynamicSegment(segment: string) {
  return segment.startsWith("[") && segment.endsWith("]")
}

function matchesRoutePath(routePath: string, pathname: string) {
  const routeSegments = normalizePathname(routePath).split("/").filter(Boolean)
  const pathSegments = normalizePathname(pathname).split("/").filter(Boolean)

  if (routeSegments.length !== pathSegments.length) {
    return false
  }

  return routeSegments.every((segment, index) => {
    return isDynamicSegment(segment) || segment === pathSegments[index]
  })
}

export function getRouteAccess(pathname: string) {
  return appRoutes.find((route) => matchesRoutePath(route.path, pathname))
}

export function canAccessRoute(pathname: string, role: Role) {
  const route = getRouteAccess(pathname)

  if (!route) {
    return true
  }

  return (route.roles as readonly Role[]).includes(role)
}

export function getDefaultRouteForRole(role: Role) {
  const route = appRoutes.find((appRoute) =>
    (appRoute.roles as readonly Role[]).includes(role)
  )

  return route?.path ?? defaultProtectedRoute
}
