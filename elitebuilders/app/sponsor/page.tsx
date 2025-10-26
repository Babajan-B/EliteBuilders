"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Users, TrendingUp, Calendar, Award, Eye, BarChart3, Target, Clock, CheckCircle2, XCircle, Brain, Zap } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function SponsorDashboardPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [allChallenges, setAllChallenges] = useState<any[]>([])
  const [sponsorSubmissions, setSponsorSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function fetchSponsorData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          return
        }

        // Fetch sponsor organization
        const { data: orgData } = await supabase
          .from("sponsor_orgs")
          .select("*")
          .limit(1)
          .single()

        if (orgData) {
          setOrganization(orgData)

          // Fetch challenges for this organization
          const { data: challengesData } = await supabase
            .from("challenges")
            .select("*")
            .eq("sponsor_org_id", orgData.org_id)
            .order("created_at", { ascending: false })

          setAllChallenges(challengesData || [])

          // Fetch submissions for these challenges
          if (challengesData && challengesData.length > 0) {
            const challengeIds = challengesData.map(c => c.challenge_id)
            const { data: submissionsData } = await supabase
              .from("submissions")
              .select("*")
              .in("challenge_id", challengeIds)

            // Fetch profile details for each submission
            const submissionsWithDetails = await Promise.all(
              (submissionsData || []).map(async (submission) => {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("display_name")
                  .eq("id", submission.user_id)
                  .single()

                return {
                  ...submission,
                  profiles: profile
                }
              })
            )

            setSponsorSubmissions(submissionsWithDetails)
          }
        }
      } catch (error) {
        console.error("Error:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchSponsorData()
  }, [supabase])

  const activeCompetitions = allChallenges.filter((c: any) => c.is_active)
  const completedCompetitions = allChallenges.filter((c: any) => !c.is_active)

  // Calculate comprehensive stats
  const totalSubmissions = sponsorSubmissions.length
  const totalParticipants = new Set(sponsorSubmissions.map((s: any) => s.submitter?.id || s.submitterName)).size
  
  // Scoring analytics
  const scoredSubmissions = sponsorSubmissions.filter((s: any) => s.score !== null)
  const avgScore = scoredSubmissions.length > 0 
    ? Math.round(scoredSubmissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / scoredSubmissions.length)
    : 0

  // Auto scoring analytics
  const avgAutoScore = sponsorSubmissions.length > 0
    ? Math.round(sponsorSubmissions.reduce((sum: number, s: any) => sum + (s.scores?.auto?.score_auto || s.auto_score || 0), 0) / sponsorSubmissions.length)
    : 0

  // LLM scoring analytics
  const avgLLMScore = sponsorSubmissions.length > 0
    ? Math.round(sponsorSubmissions.reduce((sum: number, s: any) => sum + (s.scores?.llm?.score_llm || s.llm_score || 0), 0) / sponsorSubmissions.length)
    : 0

  // Status breakdown
  const finalSubmissions = sponsorSubmissions.filter((s: any) => s.status === "FINAL")
  const provisionalSubmissions = sponsorSubmissions.filter((s: any) => s.status === "PROVISIONAL")
  const scoringSubmissions = sponsorSubmissions.filter((s: any) => s.status === "SCORING")

  // Top performers with enhanced data
  const topPerformers = scoredSubmissions
    .sort((a: any, b: any) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map((submission: any, index: number) => ({
      rank: index + 1,
      name: submission.submitter?.display_name || submission.submitterName || "Unknown",
      email: submission.submitter?.id || "unknown@example.com",
      score: submission.score || 0,
      autoScore: submission.scores?.auto?.score_auto || submission.auto_score || 0,
      llmScore: submission.scores?.llm?.score_llm || submission.llm_score || 0,
      competition: submission.competition_title,
      status: submission.status,
      avatar: submission.submitter?.avatar_url
    }))

  // Competition insights
  const competitionInsights = allCompetitions.map((competition: any) => {
    const compSubmissions = sponsorSubmissions.filter((s: any) => s.competition_id === competition.id)
    const compScored = compSubmissions.filter((s: any) => s.score !== null)
    const avgCompScore = compScored.length > 0 
      ? Math.round(compScored.reduce((sum: number, s: any) => sum + (s.score || 0), 0) / compScored.length)
      : 0

    return {
      ...competition,
      submissionCount: compSubmissions.length,
      scoredCount: compScored.length,
      avgScore: avgCompScore,
      finalCount: compSubmissions.filter((s: any) => s.status === "FINAL").length,
      provisionalCount: compSubmissions.filter((s: any) => s.status === "PROVISIONAL").length,
    }
  })

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    FINAL: "bg-green-500/10 text-green-500 border-green-500/20",
    PROVISIONAL: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    SCORING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  }

  if (loading) {
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

  if (!organization) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No sponsor organization found.</p>
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
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">{organization.org_name || "Sponsor Dashboard"}</h1>
              <p className="text-lg text-muted-foreground">Sponsor Dashboard & Analytics</p>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Total Competitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{allCompetitions.length}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {activeCompetitions.length} active, {completedCompetitions.length} completed
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Across {allCompetitions.length} competitions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-500" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSubmissions}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {finalSubmissions.length} final, {provisionalSubmissions.length} pending
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-500" />
                Average Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{avgScore}/100</p>
              <p className="text-xs text-muted-foreground mt-1">
                From {scoredSubmissions.length} scored submissions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scoring Analytics */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Auto Scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{avgAutoScore}/20</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average automated score
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                LLM Scoring
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-purple-600">{avgLLMScore}/60</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average AI evaluation score
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Completion Rate
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {totalSubmissions > 0 ? Math.round((finalSubmissions.length / totalSubmissions) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Submissions with final scores
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Enhanced Competitions */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Your Competitions</h2>

              {competitionInsights.length > 0 ? (
                <div className="space-y-4">
                  {competitionInsights.map((competition: any) => (
                    <Card key={competition.id} className="hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className={statusColors[competition.status as keyof typeof statusColors]}
                              >
                                {competition.status}
                              </Badge>
                              {competition.avgScore > 0 && (
                                <Badge variant="secondary" className="font-semibold">
                                  Avg: {competition.avgScore}/100
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl mb-1">{competition.title}</CardTitle>
                            <CardDescription>{competition.description}</CardDescription>
                          </div>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/sponsor/competitions/${competition.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-muted-foreground mb-1">Total Submissions</p>
                            <p className="text-2xl font-bold">{competition.submissionCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Final Scores</p>
                            <p className="text-2xl font-bold text-green-500">{competition.finalCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Pending Review</p>
                            <p className="text-2xl font-bold text-yellow-500">{competition.provisionalCount}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground mb-1">Prize Pool</p>
                            <p className="text-2xl font-bold text-primary">
                              ${competition.prize_pool?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        
                        {/* Progress bars for scoring breakdown */}
                        {competition.submissionCount > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Scoring Progress</span>
                              <span className="font-semibold">
                                {competition.finalCount}/{competition.submissionCount}
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width: `${(competition.finalCount / competition.submissionCount) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(competition.start_date), "MMM d")} -{" "}
                            {format(new Date(competition.end_date), "MMM d, yyyy")}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <p className="text-muted-foreground mb-4">No competitions yet.</p>
                    <p className="text-sm text-muted-foreground">Contact support to create your first competition.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Enhanced Top Performers */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
                <CardDescription>Highest scoring submissions across your competitions</CardDescription>
              </CardHeader>
              <CardContent>
                {topPerformers.length > 0 ? (
                  <div className="space-y-4">
                    {topPerformers.map((performer: any) => (
                      <div key={`${performer.email}-${performer.rank}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                          performer.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                          performer.rank === 2 ? 'bg-gray-100 text-gray-700' :
                          performer.rank === 3 ? 'bg-orange-100 text-orange-700' :
                          'bg-primary/10 text-primary'
                        }`}>
                          {performer.rank}
                        </div>
                        <Avatar className="h-10 w-10">
                          {performer.avatar ? (
                            <img src={performer.avatar} alt={performer.name} />
                          ) : (
                            <AvatarFallback>{performer.name.charAt(0).toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{performer.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{performer.competition}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={`text-xs ${
                              statusColors[performer.status as keyof typeof statusColors]
                            }`}>
                              {performer.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="font-semibold mb-1">
                            {performer.score}/100
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            Auto: {performer.autoScore} | LLM: {performer.llmScore}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No scored submissions yet. Check back once judges have reviewed entries.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Competition Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Competition Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Active Competitions</span>
                    <span className="font-semibold">{activeCompetitions.length}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{
                        width: `${allCompetitions.length > 0 ? (activeCompetitions.length / allCompetitions.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Completed Competitions</span>
                    <span className="font-semibold">{completedCompetitions.length}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{
                        width: `${allCompetitions.length > 0 ? (completedCompetitions.length / allCompetitions.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Avg Submissions per Competition</span>
                    <span className="font-semibold">
                      {allCompetitions.length > 0 ? Math.round(totalSubmissions / allCompetitions.length) : 0}
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Scoring Completion Rate</span>
                    <span className="font-semibold">
                      {totalSubmissions > 0 ? Math.round((finalSubmissions.length / totalSubmissions) * 100) : 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${totalSubmissions > 0 ? (finalSubmissions.length / totalSubmissions) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
