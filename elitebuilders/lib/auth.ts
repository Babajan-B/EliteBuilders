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
  console.log('[AUTH] 🔍 Getting current user...')
  const supabase = await getSupabaseServerClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log('[AUTH] Supabase auth result:', { hasUser: !!user, error: error?.message })

  if (error || !user) {
    console.log('[AUTH] ❌ No user found or error:', error?.message)
    return null
  }

  console.log('[AUTH] ✅ User found:', { id: user.id, email: user.email })

  // Fetch user profile with role from database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single()

  console.log('[AUTH] Profile lookup:', { hasProfile: !!profile, role: profile?.role, error: profileError?.message })

  if (profileError) {
    console.error('[AUTH] ❌ Profile error:', profileError)
  }

  const authUser = {
    id: user.id,
    email: user.email!,
    role: profile?.role || "builder",
    name: profile?.display_name,
    organizationId: undefined,
  }

  console.log('[AUTH] ✅ Returning user:', { email: authUser.email, role: authUser.role })

  return authUser
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
