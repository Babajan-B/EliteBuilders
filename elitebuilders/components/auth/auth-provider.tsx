"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export interface AuthUser {
  id: string
  email: string
  role: "builder" | "judge" | "sponsor" | "admin"
  name?: string
  organizationId?: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  signOut: async () => {},
  signIn: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()
  const router = useRouter()

  useEffect(() => {
    // Check active session
    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        console.log("AuthProvider: Auth state changed - SIGNED_IN or TOKEN_REFRESHED")
        await checkUser()
      } else if (event === 'SIGNED_OUT') {
        console.log("AuthProvider: Auth state changed - SIGNED_OUT")
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  async function checkUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        console.log("AuthProvider: User authenticated:", authUser.id)
        
        // Fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        if (profileError) {
          console.error("AuthProvider: Profile fetch error:", profileError)
          console.error("AuthProvider: Profile error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code
          })
          
          // If profile doesn't exist, use auth user data temporarily
          // The trigger should create it, or we need to run CREATE_MISSING_PROFILE.sql
          console.warn("AuthProvider: Profile not found, using auth user data")
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            role: "builder",
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "User",
          })
          setLoading(false)
          return
        }

        if (profile) {
          console.log("AuthProvider: Profile loaded:", {
            id: profile.id,
            email: profile.email,
            role: profile.role,
            name: profile.display_name
          })
          setUser({
            id: profile.id,
            email: profile.email || authUser.email || "",
            role: profile.role || "builder",
            name: profile.display_name || authUser.user_metadata?.name || "",
          })
        } else {
          console.warn("AuthProvider: No profile data returned")
          // Use auth user data as fallback
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            role: "builder",
            name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || "User",
          })
        }
      } else {
        console.log("AuthProvider: No authenticated user")
        setUser(null)
      }
    } catch (error) {
      console.error("AuthProvider: Error checking user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw error
    }

    await checkUser()
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    router.push("/")
  }

  return <AuthContext.Provider value={{ user, loading, signOut, signIn }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
