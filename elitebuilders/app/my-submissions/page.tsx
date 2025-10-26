"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Github, Calendar, Award, TrendingUp, Code2, Sparkles, FileText, Clock, CheckCircle, XCircle, Filter, ChevronDown } from "lucide-react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function MySubmissionsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<string>("all")
  const [challenges, setChallenges] = useState<Array<{ id: string; title: string }>>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, pending: 0, scored: 0, avgScore: 0 })
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchMySubmissions() {
      console.log("📥 MY SUBMISSIONS: Starting to fetch...")
      
      try {
        if (!user) {
          console.log("❌ MY SUBMISSIONS: No user found")
          setLoading(false)
          return
        }

        console.log("👤 MY SUBMISSIONS: User ID:", user.id)

        // Fetch submissions for the current user
        const { data, error } = await supabase
          .from("submissions")
          .select(`
            *,
            challenges:challenge_id (
              id,
              title,
              brief_md,
              deadline_utc,
              prize_pool
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("❌ MY SUBMISSIONS: Supabase error:", error)
          setLoading(false)
          return
        }

        console.log("✅ MY SUBMISSIONS: Fetched", data?.length || 0, "submissions")

        const submissionsData = data || []
        setSubmissions(submissionsData)
        setFilteredSubmissions(submissionsData)

        // Extract unique challenges for dropdown
        const uniqueChallenges = Array.from(
          new Map(
            submissionsData
              .filter(s => s.challenges)
              .map(s => [s.challenges.id, { id: s.challenges.id, title: s.challenges.title }])
          ).values()
        )
        setChallenges(uniqueChallenges)
        console.log("🏆 MY SUBMISSIONS: Found", uniqueChallenges.length, "unique challenges")

        // Calculate stats
        const total = submissionsData.length
        const scored = submissionsData.filter(s => s.score_display !== null && s.score_display !== undefined).length
        const pending = total - scored
        const avgScore = scored > 0 
          ? submissionsData
              .filter(s => s.score_display !== null && s.score_display !== undefined)
              .reduce((sum, s) => sum + (s.score_display || 0), 0) / scored
          : 0

        setStats({ total, pending, scored, avgScore: Math.round(avgScore) })
        console.log("📊 MY SUBMISSIONS: Stats calculated:", { total, pending, scored, avgScore })

      } catch (error) {
        console.error("❌ MY SUBMISSIONS: Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMySubmissions()
  }, [supabase, user])

  // Filter submissions when challenge selection changes
  useEffect(() => {
    if (selectedChallenge === "all") {
      setFilteredSubmissions(submissions)
    } else {
      const filtered = submissions.filter(s => s.challenge_id === selectedChallenge)
      setFilteredSubmissions(filtered)
      console.log("🔍 MY SUBMISSIONS: Filtered to", filtered.length, "submissions for challenge", selectedChallenge)
    }
  }, [selectedChallenge, submissions])

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  // Helper function to format date
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (seconds < 60) return "just now"
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 4) return `${weeks}w ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">Please sign in to view your submissions.</p>
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">My Submissions</h1>
              <p className="text-lg text-muted-foreground">Track your competition entries and their performance</p>
            </div>
            
            {/* Challenge Filter Dropdown */}
            {challenges.length > 0 && (
              <div className="w-64">
                <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                  <SelectTrigger className="w-full">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Challenges" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <span>All Challenges</span>
                        <Badge variant="outline" className="ml-auto">
                          {submissions.length}
                        </Badge>
                      </div>
                    </SelectItem>
                    {challenges.map((challenge) => {
                      const count = submissions.filter(s => s.challenge_id === challenge.id).length
                      return (
                        <SelectItem key={challenge.id} value={challenge.id}>
                          <div className="flex items-center gap-2">
                            <span className="truncate">{challenge.title}</span>
                            <Badge variant="outline" className="ml-auto">
                              {count}
                            </Badge>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        {submissions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs">
                  {selectedChallenge === "all" ? "Total Submissions" : "Filtered Submissions"}
                </CardDescription>
                <CardTitle className="text-3xl">
                  {selectedChallenge === "all" ? stats.total : filteredSubmissions.length}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Pending Review
                </CardDescription>
                <CardTitle className="text-3xl text-yellow-500">{stats.pending}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Scored
                </CardDescription>
                <CardTitle className="text-3xl text-green-500">{stats.scored}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription className="text-xs flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Average Score
                </CardDescription>
                <CardTitle className="text-3xl text-primary">{stats.avgScore}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Submissions List */}
        {filteredSubmissions.length > 0 ? (
          <div className="grid gap-6">
            {filteredSubmissions.map((submission) => {
              const challenge = submission.challenges
              const hasScore = submission.score_display !== null && submission.score_display !== undefined
              const hasAIAnalysis = submission.ai_analysis_json !== null

              return (
                <Card key={submission.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-2xl mb-2">
                          {challenge?.title || "Challenge"}
                        </CardTitle>
                        <CardDescription className="text-base flex items-center gap-2">
                          <span>Submitted {formatTimeAgo(submission.created_at)}</span>
                          {challenge?.prize_pool && (
                            <>
                              <span>•</span>
                              <span className="text-primary font-medium">${challenge.prize_pool.toLocaleString()} Prize</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {hasScore ? (
                          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-lg px-4 py-1">
                            <Award className="h-4 w-4 mr-1" />
                            {submission.score_display}/100
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending Review
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* AI Analysis Section */}
                    {hasAIAnalysis && submission.ai_analysis_json && (
                      <div className="grid md:grid-cols-3 gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Code2 className="h-3 w-3" />
                            <span>Code Quality</span>
                          </div>
                          <div className="text-2xl font-bold text-purple-500">
                            {submission.ai_analysis_json.codeQuality || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Sparkles className="h-3 w-3" />
                            <span>Innovation</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-500">
                            {submission.ai_analysis_json.innovation || "N/A"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>Presentation</span>
                          </div>
                          <div className="text-2xl font-bold text-cyan-500">
                            {submission.ai_analysis_json.presentation || "N/A"}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Writeup/Description */}
                    {submission.writeup_md && (
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Project Description
                        </h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                          {submission.writeup_md}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 pt-2">
                      {submission.repo_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={submission.repo_url} target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4 mr-2" />
                            View Code
                          </a>
                        </Button>
                      )}
                      {submission.demo_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Live Demo
                          </a>
                        </Button>
                      )}
                      {submission.deck_url && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={submission.deck_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Presentation
                          </a>
                        </Button>
                      )}
                      {challenge?.id && (
                        <Button variant="default" size="sm" asChild>
                          <Link href={`/submit/${challenge.id}`}>
                            Update Submission
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : submissions.length > 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No submissions found for the selected challenge.
              </p>
              <Button variant="outline" onClick={() => setSelectedChallenge("all")}>
                View All Submissions
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">You haven't submitted to any challenges yet.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by browsing available challenges and make your first submission.
              </p>
              <Button asChild>
                <Link href="/">Browse Challenges</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
