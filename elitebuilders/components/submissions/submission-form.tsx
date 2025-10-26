"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { createSubmission } from "@/lib/api-client"

interface SubmissionFormProps {
  competitionId: string
  existingSubmission?: any
  userId: string
}

export function SubmissionForm({ competitionId, existingSubmission, userId }: SubmissionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    repo_url: existingSubmission?.repo_url || existingSubmission?.artifacts?.repo_url || "",
    deck_url: existingSubmission?.deck_url || existingSubmission?.artifacts?.deck_url || "",
    demo_url: existingSubmission?.demo_url || existingSubmission?.artifacts?.demo_url || "",
    writeup_md: existingSubmission?.writeup_md || existingSubmission?.artifacts?.writeup_excerpt || "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      // Use backend API client
      const result = await createSubmission({
        challenge_id: competitionId,
        repo_url: formData.repo_url,
        deck_url: formData.deck_url || undefined,
        demo_url: formData.demo_url || undefined,
        writeup_md: formData.writeup_md,
      })

      if (!result.ok) {
        throw new Error(result.error || "Failed to submit")
      }

      // Trigger AI analysis in the background (don't wait for it)
      const submissionId = result.data?.id
      if (submissionId) {
        // Fire and forget - AI analysis happens in background
        fetch('/api/submissions/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId }),
        }).catch(err => {
          console.error('Failed to trigger AI analysis:', err)
          // Don't show error to user - this is a background process
        })
      }

      setSuccess(true)
      setTimeout(() => {
        router.push(`/competitions/${competitionId}`)
        router.refresh()
      }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingSubmission ? "Update Your Submission" : "Submit Your Entry"}</CardTitle>
        <CardDescription>
          {existingSubmission
            ? "Make changes to your existing submission"
            : "Fill out the form below to submit your entry"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="repo_url">GitHub Repository URL *</Label>
            <Input
              id="repo_url"
              type="url"
              placeholder="https://github.com/username/repo"
              value={formData.repo_url}
              onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
              required
            />
            <p className="text-xs text-muted-foreground">Your GitHub repository must be public</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deck_url">Pitch Deck URL</Label>
            <Input
              id="deck_url"
              type="url"
              placeholder="https://docs.google.com/presentation/..."
              value={formData.deck_url}
              onChange={(e) => setFormData({ ...formData, deck_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Optional: Link to your presentation or pitch deck</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="demo_url">Demo Video/Live Demo URL</Label>
            <Input
              id="demo_url"
              type="url"
              placeholder="https://youtube.com/... or https://your-demo.vercel.app"
              value={formData.demo_url}
              onChange={(e) => setFormData({ ...formData, demo_url: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Optional: Link to a live demo or demo video</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="writeup_md">Project Writeup (Markdown) *</Label>
            <Textarea
              id="writeup_md"
              placeholder="# Project Title

## Problem Statement
Describe the problem your project solves...

## Solution
Explain your approach...

## Key Features
- Feature 1
- Feature 2

## Technical Implementation
..."
              value={formData.writeup_md}
              onChange={(e) => setFormData({ ...formData, writeup_md: e.target.value })}
              required
              rows={12}
              className="resize-none font-mono text-sm"
              minLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Minimum 50 characters. Markdown formatting supported. Provide detailed description of your project.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-500/20 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-500">
                Submission {existingSubmission ? "updated" : "created"} successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {existingSubmission ? "Updating..." : "Submitting..."}
                </>
              ) : existingSubmission ? (
                "Update Submission"
              ) : (
                "Submit Entry"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
