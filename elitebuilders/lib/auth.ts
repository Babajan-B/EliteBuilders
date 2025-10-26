import { getSupabaseServerClient } from "./supabase/server"

export type UserRole = "builder" | "judge" | "sponsor" | "admin"

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  name?: string
  organizationId?: string
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  // Fetch user profile with role from database
  const { data: profile } = await supabase
    .from("users")
    .select("role, name, organization_id")
    .eq("id", user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: profile?.role || "builder",
    name: profile?.name,
    organizationId: profile?.organization_id,
  }
}

export async function requireAuth(allowedRoles?: UserRole[]) {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden")
  }

  return user
}
