"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const supabase = getSupabaseBrowserClient()

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Sign up user with metadata
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          name,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          profile_picture_url: profilePictureUrl,
        },
      },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Database trigger will create the profile automatically
      // User metadata is already stored, we'll update profile fields after login

      // Wait a moment for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to dashboard - profile was created by trigger
      router.push("/dashboard")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Create your EliteBuilders account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="github">
                GitHub URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="github"
                type="url"
                placeholder="https://github.com/yourusername"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                required
                pattern="https?://(www\.)?github\.com/[a-zA-Z0-9_-]+/?"
                title="Please enter a valid GitHub profile URL (e.g., https://github.com/username)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">
                LinkedIn URL <span className="text-destructive">*</span>
              </Label>
              <Input
                id="linkedin"
                type="url"
                placeholder="https://linkedin.com/in/yourname"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                required
                pattern="https?://(www\.)?linkedin\.com/(in|pub)/[a-zA-Z0-9_-]+/?"
                title="Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/username)"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePicture">Profile Picture URL (Optional)</Label>
              <Input
                id="profilePicture"
                type="url"
                placeholder="https://example.com/your-photo.jpg"
                value={profilePictureUrl}
                onChange={(e) => setProfilePictureUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Provide a URL to your profile picture
              </p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Sign Up"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
