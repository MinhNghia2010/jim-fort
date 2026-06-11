import type { JwtPayload } from "@supabase/auth-js"

import { isRole, type Role } from "@/lib/routes"

export const authContextHeader = "x-jim-fort-auth-context"

export type AuthenticatedUser = {
  id: string
  email: string
  fullName: string
  issuedAt: number | null
  role: Role
  username: string
}

function getMetadataString(
  metadata: Record<string, unknown> | undefined,
  key: string
) {
  const value = metadata?.[key]

  return typeof value === "string" && value.trim() ? value.trim() : ""
}

function getUsername(email: string, metadata: Record<string, unknown>) {
  return (
    getMetadataString(metadata, "username") || email.split("@")[0] || "profile"
  )
}

export function createAuthContext(
  claims: JwtPayload
): AuthenticatedUser | null {
  if (!claims.sub) {
    return null
  }

  const email = typeof claims.email === "string" ? claims.email : ""
  const userMetadata = claims.user_metadata as
    | Record<string, unknown>
    | undefined
  const appMetadata = claims.app_metadata as
    | Record<string, unknown>
    | undefined
  const roleValue = appMetadata?.app_role
  const role = isRole(roleValue) ? roleValue : "member"
  const fullName =
    getMetadataString(userMetadata, "full_name") ||
    getMetadataString(userMetadata, "name") ||
    email ||
    "Gym User"

  return {
    id: claims.sub,
    email,
    fullName,
    issuedAt: typeof claims.iat === "number" ? claims.iat : null,
    role,
    username: getUsername(email, userMetadata ?? {}),
  }
}

export function serializeAuthContext(user: AuthenticatedUser) {
  return encodeURIComponent(JSON.stringify(user))
}

export function parseAuthContext(value: string | null) {
  if (!value) {
    return null
  }

  try {
    const context = JSON.parse(
      decodeURIComponent(value)
    ) as Partial<AuthenticatedUser>

    if (
      typeof context.id !== "string" ||
      typeof context.email !== "string" ||
      typeof context.fullName !== "string" ||
      !isRole(context.role) ||
      typeof context.username !== "string"
    ) {
      return null
    }

    return {
      id: context.id,
      email: context.email,
      fullName: context.fullName,
      issuedAt: typeof context.issuedAt === "number" ? context.issuedAt : null,
      role: context.role,
      username: context.username,
    } satisfies AuthenticatedUser
  } catch {
    return null
  }
}
