"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { SubmissionForm } from "@/components/submissions/submission-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

export default function SubmitPage({
  params,
}: {
  params: Promise<{ competitionId: string }>
}) {
  const { competitionId } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [competition, setCompetition] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch competition
        const { data: challengeData, error: challengeError } = await supabase
          .from("challenges")
          .select("*")
          .eq("id", competitionId)
          .single()

        if (challengeError || !challengeData) {
          setError("Competition not found")
          setLoading(false)
          return
        }

        const challenge = challengeData as any

        // Extract prize from prize_md if prize_pool not set
        let prize_pool = challenge.prize_pool || 0
        if (!prize_pool && challenge.prize_md) {
          const match = challenge.prize_md.match(/\$?([\d,]+)/)
          if (match) {
            prize_pool = parseFloat(match[1].replace(/,/g, ''))
          }
        }

        // Map to expected format
        const formattedCompetition = {
          id: challenge.id,
          title: challenge.title,
          description: challenge.brief_md?.substring(0, 200) || "",
          status: challenge.is_active ? "active" : "completed",
          prize_pool: prize_pool,
          start_date: challenge.created_at,
          end_date: challenge.deadline_utc,
          difficulty: challenge.difficulty || "medium",
        }

        setCompetition(formattedCompetition)

        // Fetch submissions if user is logged in
        if (user) {
          const { data: submissionsData } = await supabase
            .from("submissions")
            .select("*")
            .eq("challenge_id", competitionId)
            .eq("user_id", user.id)

          setSubmissions(submissionsData || [])
        }

        setLoading(false)
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load competition")
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [competitionId, user, authLoading, supabase])

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/auth/signin?redirect=/submit/${competitionId}`)
    }
  }, [user, authLoading, router, competitionId])

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

  if (error || !competition) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error || "Competition not found"}</AlertDescription>
          </Alert>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect
  }

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  const existingSubmission = submissions.length > 0 ? submissions[0] : null

  if (competition.status !== "active") {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Submission Closed</AlertTitle>
            <AlertDescription>
              This competition is not currently accepting submissions.
              {competition.status === "upcoming" && " It hasn't started yet."}
              {competition.status === "completed" && " It has ended."}
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
          <div className="flex items-center gap-3 mb-4">
            <h1 className="text-3xl font-bold">{competition.title}</h1>
            <Badge className={statusColors[competition.status as keyof typeof statusColors] + " capitalize"}>
              {competition.status}
            </Badge>
          </div>
          <p className="text-muted-foreground">{competition.description}</p>
        </div>

        {/* Submission Form */}
        <Card>
          <CardHeader>
            <CardTitle>{existingSubmission ? "Update Your Submission" : "Submit Your Entry"}</CardTitle>
            <CardDescription>
              {existingSubmission
                ? "You've already submitted an entry. You can update it below."
                : "Complete the form below to submit your entry to this competition."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionForm competitionId={competitionId} existingSubmission={existingSubmission} userId={user.id} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
