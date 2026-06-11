import { getAuthenticatedUser } from "@/lib/auth/current-user"
import type { Role } from "@/lib/routes"

export async function getAuthenticatedRole(): Promise<Role> {
  const user = await getAuthenticatedUser()

  return user.role
}
