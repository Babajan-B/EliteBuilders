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
  error: string | null
  retryAuth: () => Promise<void>
  signOut: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  error: null,
  retryAuth: async () => {},
  signOut: async () => {},
  signIn: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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

  async function checkUser(retryCount = 0) {
    const maxRetries = 3

    try {
      setError(null)
      const { data: { user: authUser } } = await supabase.auth.getUser()

      if (authUser) {
        console.log("AuthProvider: User authenticated:", authUser.id)

        // Fetch user profile from database with timeout
        const profilePromise = supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single()

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Profile fetch timeout')), 10000)
        )

        const { data: profile, error: profileError } = await Promise.race([
          profilePromise,
          timeoutPromise
        ]) as { data: any, error: any }

        if (profileError) {
          console.error("AuthProvider: Profile fetch error:", profileError)
          console.error("AuthProvider: Profile error details:", {
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint,
            code: profileError.code,
            retryCount
          })

          // Retry logic for transient errors
          if (retryCount < maxRetries && (
            profileError.message?.includes('timeout') ||
            profileError.message?.includes('network') ||
            profileError.code === 'PGRST116' // Row not found - might be timing issue with trigger
          )) {
            console.log(`AuthProvider: Retrying profile fetch (${retryCount + 1}/${maxRetries})...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))) // Exponential backoff
            return checkUser(retryCount + 1)
          }

          // If profile genuinely doesn't exist after retries, set error
          setError("Failed to load user profile. Please try refreshing the page.")
          setUser(null)
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
          setError(null)
        } else {
          console.error("AuthProvider: No profile data returned after successful query")
          setError("User profile is empty. Please contact support.")
          setUser(null)
        }
      } else {
        console.log("AuthProvider: No authenticated user")
        setUser(null)
        setError(null)
      }
    } catch (error: any) {
      console.error("AuthProvider: Error checking user:", error)

      // Retry on timeout or network errors
      if (retryCount < maxRetries && (
        error.message?.includes('timeout') ||
        error.message?.includes('network') ||
        error.message?.includes('fetch')
      )) {
        console.log(`AuthProvider: Retrying after error (${retryCount + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)))
        return checkUser(retryCount + 1)
      }

      setError(error.message || "Authentication error. Please try again.")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function retryAuth() {
    setLoading(true)
    await checkUser(0)
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

  return <AuthContext.Provider value={{ user, loading, error, retryAuth, signOut, signIn }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
