"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, Trophy, Calendar, DollarSign } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function SubmitPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [competitions, setCompetitions] = useState<any[]>([])
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>("")
  const [selectedCompetition, setSelectedCompetition] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = getSupabaseBrowserClient()

  const [formData, setFormData] = useState({
    repo_url: "",
    deck_url: "",
    demo_url: "",
    writeup_md: "",
  })

  // Fetch active competitions
  useEffect(() => {
    async function loadCompetitions() {
      console.log("📥 SUBMIT: Loading competitions...")
      try {
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("is_active", true)
          .order("deadline_utc", { ascending: true })

        if (error) {
          console.error("❌ SUBMIT: Error fetching competitions:", error)
          setError("Failed to load competitions")
        } else {
          console.log("✅ SUBMIT: Loaded", data?.length || 0, "competitions")
          setCompetitions(data || [])
        }
      } catch (err) {
        console.error("❌ SUBMIT: Error:", err)
        setError("Failed to load competitions")
      } finally {
        setLoading(false)
      }
    }

    loadCompetitions()
  }, [supabase])

  // Update selected competition details when selection changes
  useEffect(() => {
    if (selectedCompetitionId) {
      const comp = competitions.find(c => c.id === selectedCompetitionId)
      setSelectedCompetition(comp)
      console.log("🎯 SUBMIT: Selected competition:", comp?.title)
    } else {
      setSelectedCompetition(null)
    }
  }, [selectedCompetitionId, competitions])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/signin?redirect=/submit")
    }
  }, [user, authLoading, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedCompetitionId) {
      setError("Please select a competition")
      return
    }

    setSubmitting(true)
    setError("")
    setSuccess(false)

    try {
      console.log("📤 SUBMIT: Creating submission for competition:", selectedCompetitionId)
      console.log("📤 SUBMIT: User ID:", user?.id)
      console.log("📤 SUBMIT: Form data:", formData)

      // Create submission
      const { data: submission, error: submitError } = await supabase
        .from("submissions")
        .insert({
          challenge_id: selectedCompetitionId,
          user_id: user?.id,
          repo_url: formData.repo_url,
          deck_url: formData.deck_url || null,
          demo_url: formData.demo_url || null,
          writeup_md: formData.writeup_md,
        })
        .select()
        .single()

      console.log("📤 SUBMIT: Insert response:", { data: submission, error: submitError })

      if (submitError) {
        console.error("❌ SUBMIT: Error creating submission:", submitError)
        throw new Error(submitError.message || "Failed to submit")
      }

      if (!submission) {
        console.error("❌ SUBMIT: No submission data returned")
        throw new Error("Submission created but no data returned")
      }

      console.log("✅ SUBMIT: Submission created successfully:", submission.id)

      // Trigger AI analysis in the background (don't wait for it)
      if (submission.id) {
        console.log("🤖 SUBMIT: Triggering AI analysis...")
        fetch('/api/submissions/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId: submission.id }),
        }).catch(err => {
          console.error('❌ SUBMIT: Failed to trigger AI analysis:', err)
        })
      }

      setSuccess(true)
      console.log("✅ SUBMIT: Success! Redirecting in 2 seconds...")
      setTimeout(() => {
        router.push("/my-submissions")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error("❌ SUBMIT: Error:", err)
      setError(err.message || "Failed to submit")
    } finally {
      setSubmitting(false)
      console.log("📤 SUBMIT: Form submission complete")
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  if (competitions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Active Competitions</AlertTitle>
            <AlertDescription>
              There are no active competitions at the moment. Check back soon!
            </AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Submit Your Entry</h1>
          <p className="text-lg text-muted-foreground">
            Choose a competition and submit your project
          </p>
        </div>

        {/* Competition Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Competition</CardTitle>
            <CardDescription>
              Choose which competition you want to submit to
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="competition">Competition *</Label>
              <Select value={selectedCompetitionId} onValueChange={setSelectedCompetitionId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a competition..." />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((comp) => (
                    <SelectItem key={comp.id} value={comp.id}>
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        <span>{comp.title}</span>
                        {comp.prize_pool && (
                          <span className="text-xs text-primary ml-2">
                            ${comp.prize_pool.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competition Details Preview */}
            {selectedCompetition && (
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  {selectedCompetition.prize_pool && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <span className="font-medium">${selectedCompetition.prize_pool.toLocaleString()} Prize Pool</span>
                    </div>
                  )}
                  {selectedCompetition.deadline_utc && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Deadline: {new Date(selectedCompetition.deadline_utc).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                {selectedCompetition.brief_md && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {selectedCompetition.brief_md.substring(0, 200)}...
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
            <CardDescription>
              Provide information about your submission
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
                  disabled={!selectedCompetitionId}
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
                  disabled={!selectedCompetitionId}
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
                  disabled={!selectedCompetitionId}
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
                  disabled={!selectedCompetitionId}
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
                    Submission created successfully! Redirecting to your submissions...
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button 
                  type="submit" 
                  disabled={submitting || !selectedCompetitionId} 
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Entry"
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.back()} 
                  disabled={submitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
