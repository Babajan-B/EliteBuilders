"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Trophy,
  FileText,
  TrendingUp,
  Clock,
  Award,
  Calendar,
  Github,
  ExternalLink,
  Plus,
  Target,
  AlertCircle,
  RefreshCcw,
} from "lucide-react"
import Link from "next/link"
import { format, formatDistanceToNow } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

interface UserStats {
  totalSubmissions: number
  approvedSubmissions: number
  pendingSubmissions: number
  averageScore: number
}

export default function DashboardPage() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const { user, loading: authLoading, error: authError, retryAuth } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<UserStats>({
    totalSubmissions: 0,
    approvedSubmissions: 0,
    pendingSubmissions: 0,
    averageScore: 0,
  })
  const [competitions, setCompetitions] = useState<any[]>([])
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([])

  // Redirect non-builder users to their appropriate dashboards
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === "admin") {
        router.push("/admin")
      } else if (user.role === "sponsor") {
        router.push("/sponsor")
      } else if (user.role === "judge") {
        router.push("/judge")
      }
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function loadDashboard() {
      if (!user || user.role !== "builder") {
        setLoading(false)
        return
      }

      try {

        // Fetch user submissions
        const { data: submissionsData, error: submissionsError } = await supabase
          .from("submissions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (!submissionsError && submissionsData) {
          const approvedCount = submissionsData.filter((s: any) => s.status === "approved").length
          const pendingCount = submissionsData.filter((s: any) => s.status === "pending").length

          // Calculate average score
          const scoredSubmissions = submissionsData.filter((s: any) => s.score_display !== null)
          const avgScore =
            scoredSubmissions.length > 0
              ? Math.round(scoredSubmissions.reduce((acc: number, s: any) => acc + s.score_display, 0) / scoredSubmissions.length)
              : 0

          setStats({
            totalSubmissions: submissionsData.length,
            approvedSubmissions: approvedCount,
            pendingSubmissions: pendingCount,
            averageScore: avgScore,
          })

          // Get recent submissions with challenge details
          const recent = await Promise.all(
            submissionsData.slice(0, 3).map(async (submission: any) => {
              const { data: challenge } = await supabase
                .from("challenges")
                .select("title, id")
                .eq("id", submission.challenge_id)
                .single()

              return {
                ...submission,
                challenge,
              }
            })
          )

          setRecentSubmissions(recent)
        }

        // Fetch active competitions
        console.log("📊 DASHBOARD: Fetching active competitions...")
        const { data: competitionsData, error: competitionsError } = await supabase
          .from("challenges")
          .select("*")
          .eq("is_active", true)
          .order("deadline_utc", { ascending: true })
          .limit(6)

        console.log("📊 DASHBOARD: Competitions result:", { hasData: !!competitionsData, count: competitionsData?.length })

        if (!competitionsError && competitionsData) {
          console.log("✅ DASHBOARD: Processing", competitionsData.length, "competitions")
          const formattedCompetitions = competitionsData.map((comp: any) => {
            // Extract prize from prize_md if prize_pool not set
            let prize_pool = comp.prize_pool || 0
            if (!prize_pool && comp.prize_md) {
              const match = comp.prize_md.match(/\$?([\d,]+)/)
              if (match) {
                prize_pool = parseFloat(match[1].replace(/,/g, ''))
              }
            }

            return {
              id: comp.id,
              title: comp.title,
              description: comp.brief_md?.substring(0, 150) + "..." || "",
              prize_pool: prize_pool,
              end_date: comp.deadline_utc,
              difficulty: comp.difficulty || "medium",
              status: comp.is_active ? "active" : "completed",
            }
          })
          setCompetitions(formattedCompetitions)
        }
      } catch (error) {
        console.error("Dashboard error:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadDashboard()
    }
  }, [user, authLoading, supabase])

  const statusColors = {
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    approved: "bg-green-500/10 text-green-500 border-green-500/20",
    rejected: "bg-red-500/10 text-red-500 border-red-500/20",
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

  if (authError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-lg mx-auto">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <CardTitle>Authentication Error</CardTitle>
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

  if (!user) {
    router.push("/auth/signin?redirect=/dashboard")
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DashboardNav />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.name || user?.email || "Builder"}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Here's your overview of competitions and submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-500" />
                Approved
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{stats.approvedSubmissions}</p>
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
              <p className="text-3xl font-bold text-yellow-500">{stats.pendingSubmissions}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Average Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.averageScore}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content - Active Competitions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Active Competitions</CardTitle>
                    <CardDescription>Browse and submit to ongoing challenges</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/competitions">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {competitions.length > 0 ? (
                  <div className="grid gap-4">
                    {competitions.map((competition) => (
                      <div
                        key={competition.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{competition.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {competition.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                            Active
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {competition.prize_pool && (
                            <div className="flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-primary" />
                              <span>${competition.prize_pool.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Ends {formatDistanceToNow(new Date(competition.end_date), { addSuffix: true })}</span>
                          </div>
                          {competition.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                              {competition.difficulty}
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" asChild>
                            <Link href={`/competitions/${competition.id}`}>
                              <Target className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/submit/${competition.id}`}>
                              <Plus className="h-4 w-4 mr-2" />
                              Submit Entry
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No active competitions at the moment.</p>
                    <Button variant="outline" asChild>
                      <Link href="/competitions">Browse All Competitions</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Recent Submissions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Submissions</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/my-submissions">View All</Link>
                  </Button>
                </div>
                <CardDescription>Your latest competition entries</CardDescription>
              </CardHeader>
              <CardContent>
                {recentSubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {recentSubmissions.map((submission) => (
                      <div key={submission.id} className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {submission.challenge?.title || "Challenge"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              statusColors[submission.status?.toLowerCase() as keyof typeof statusColors] ||
                              "bg-gray-500/10 text-gray-500 border-gray-500/20"
                            }`}
                          >
                            {submission.status || "PENDING"}
                          </Badge>
                        </div>

                        {submission.score_display !== null && submission.score_display !== undefined && (
                          <div className="flex items-center gap-2 text-sm text-primary">
                            <Award className="h-4 w-4" />
                            <span>Score: {submission.score_display}/100</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {submission.repo_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.repo_url} target="_blank" rel="noopener noreferrer">
                                <Github className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          {submission.demo_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                        </div>

                        <Separator className="mt-4" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">No submissions yet.</p>
                    <Button size="sm" asChild>
                      <Link href="/submit">
                        <Plus className="h-4 w-4 mr-2" />
                        Make Your First Submission
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full" asChild>
                  <Link href="/submit">
                    <Plus className="h-4 w-4 mr-2" />
                    New Submission
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/competitions">
                    <Trophy className="h-4 w-4 mr-2" />
                    Browse Competitions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/my-submissions">
                    <FileText className="h-4 w-4 mr-2" />
                    My Submissions
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/leaderboard">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View Leaderboard
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
