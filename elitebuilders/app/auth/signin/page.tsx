"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@supabase/supabase-js"

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [supabase, setSupabase] = useState<any>(null)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/dashboard"

  useEffect(() => {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const client = createClient(supabaseUrl, supabaseKey)
      setSupabase(client)
      console.log("✅ Supabase client initialized")
    } else {
      console.error("❌ Missing Supabase environment variables")
      setError("Configuration error: Missing Supabase credentials")
    }
  }, [])

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    
    if (!supabase) {
      setError("Please refresh the page and try again")
      return
    }

    setLoading(true)
    setError("")

    console.log("🔐 Attempting sign in with:", email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("❌ Sign in error:", error.message)
        setError(error.message)
        setLoading(false)
      } else {
        console.log("✅ Sign in successful!")
        // Wait a brief moment to ensure session is established
        await new Promise(resolve => setTimeout(resolve, 500))
        router.push(redirect)
      }
    } catch (err: any) {
      console.error("❌ Exception during sign in:", err)
      setError(err.message || "An unexpected error occurred")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access EliteBuilders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading || !supabase}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <div className="text-sm text-center text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
