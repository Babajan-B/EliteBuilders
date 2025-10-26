"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [githubUrl, setGithubUrl] = useState("")
  const [linkedinUrl, setLinkedinUrl] = useState("")
  const [profilePictureUrl, setProfilePictureUrl] = useState("")
  const [bio, setBio] = useState("")

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

      if (profileError) {
        setError("Failed to load profile")
        console.error(profileError)
        return
      }

      if (profile) {
        setDisplayName(profile.display_name || "")
        setGithubUrl(profile.github_url || "")
        setLinkedinUrl(profile.linkedin_url || "")
        setProfilePictureUrl(profile.profile_picture_url || "")
        setBio(profile.bio || "")
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError("Not authenticated")
        setSaving(false)
        return
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          github_url: githubUrl || null,
          linkedin_url: linkedinUrl || null,
          profile_picture_url: profilePictureUrl || null,
          bio: bio || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }

      setSuccess(true)
      setSaving(false)
    } catch (err) {
      setError("An unexpected error occurred")
      setSaving(false)
      console.error(err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Profile</CardTitle>
            <CardDescription>
              Update your personal information and social links
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
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
                  title="Please enter a valid GitHub profile URL"
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
                  title="Please enter a valid LinkedIn profile URL"
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
                {profilePictureUrl && (
                  <div className="mt-2">
                    <img
                      src={profilePictureUrl}
                      alt="Profile preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio (Optional)</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  {bio.length}/500 characters
                </p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              {success && <p className="text-sm text-green-600">Profile updated successfully!</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => loadProfile()}
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
