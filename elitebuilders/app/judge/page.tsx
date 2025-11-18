"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SubmissionReviewCard } from "@/components/judge/submission-review-card"
import { ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle, RefreshCcw } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

export default function JudgeConsolePage() {
  const [allSubmissions, setAllSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading, error: authError, retryAuth } = useAuth()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchSubmissions() {
      if (!user) {
        console.log("⚠️ JUDGE: No user found, skipping fetch")
        setLoading(false)
        return
      }

      console.log("🔍 JUDGE: Starting fetch for judge:", {
        userId: user.id,
        userEmail: user.email,
        userRole: user.role
      })
      
      try {
        // Fetch only submissions assigned to this judge
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            *,
            challenges:challenge_id (
              id,
              title
            ),
            profiles:user_id (
              id,
              display_name
            )
          `)
          .eq("assigned_judge_id", user.id)  // Filter by assigned judge
          .eq("status", "READY_FOR_REVIEW")  // Only show ready submissions
          .order("created_at", { ascending: false })

        console.log("🔍 JUDGE: Query result:", {
          userId: user.id,
          dataCount: data?.length,
          error: error,
          submissions: data?.map(s => ({
            id: s.id,
            status: s.status,
            assigned_judge_id: s.assigned_judge_id,
            challenge: s.challenges?.title
          }))
        })

        if (error) {
          console.error("❌ JUDGE: Error fetching submissions:", error)
          setAllSubmissions([])
        } else {
          console.log("✅ JUDGE: Fetched submissions:", data?.length || 0)
          setAllSubmissions(data || [])
        }
      } catch (error) {
        console.error("❌ JUDGE: Unexpected error:", error)
        setAllSubmissions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [supabase, user])

  // Fix: Show READY_FOR_REVIEW submissions in pending tab
  const pendingSubmissions = allSubmissions.filter((s: any) => 
    s.status === "READY_FOR_REVIEW" || s.status === "PROVISIONAL" || s.status === "SCORING"
  )
  const approvedSubmissions = allSubmissions.filter((s: any) => 
    s.status === "REVIEWED" || (s.status === "FINAL" && s.score_display && s.score_display >= 70)
  )
  const rejectedSubmissions = allSubmissions.filter((s: any) => 
    s.status === "FINAL" && s.score_display && s.score_display < 70
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Authentication Error</h2>
              </div>
              <CardDescription>{authError}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={retryAuth} className="w-full">
                <RefreshCcw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Judge Console</h1>
          <p className="text-lg text-muted-foreground">Review and score competition submissions</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allSubmissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending Review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">{pendingSubmissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{approvedSubmissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Rejected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{rejectedSubmissions.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Submissions */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending ({pendingSubmissions.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedSubmissions.length})</TabsTrigger>
            <TabsTrigger value="all">All ({allSubmissions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingSubmissions.length > 0 ? (
              pendingSubmissions.map((submission: any) => (
                <SubmissionReviewCard 
                  key={submission.id} 
                  submission={submission}
                  submitterName={submission.submitterName}
                  submissionTitle={submission.submissionTitle}
                  judge={submission.judge}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  No pending submissions to review.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedSubmissions.length > 0 ? (
              approvedSubmissions.map((submission: any) => (
                <SubmissionReviewCard 
                  key={submission.id} 
                  submission={submission}
                  submitterName={submission.submitterName}
                  submissionTitle={submission.submissionTitle}
                  judge={submission.judge}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  No approved submissions yet.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedSubmissions.length > 0 ? (
              rejectedSubmissions.map((submission: any) => (
                <SubmissionReviewCard 
                  key={submission.id} 
                  submission={submission}
                  submitterName={submission.submitterName}
                  submissionTitle={submission.submissionTitle}
                  judge={submission.judge}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">No rejected submissions.</CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {allSubmissions.length > 0 ? (
              allSubmissions.map((submission: any) => (
                <SubmissionReviewCard 
                  key={submission.id} 
                  submission={submission}
                  submitterName={submission.submitterName}
                  submissionTitle={submission.submissionTitle}
                  judge={submission.judge}
                />
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">No submissions available.</CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
