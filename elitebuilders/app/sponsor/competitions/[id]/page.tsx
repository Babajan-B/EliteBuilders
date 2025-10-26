import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Github, ExternalLink, Calendar, Trophy, Users, Award, TrendingUp } from "lucide-react"
import { notFound } from "next/navigation"
import { format, formatDistanceToNow } from "date-fns"
import { fetchChallenge, fetchSubmissions } from "@/lib/api-client"

export default async function SponsorCompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const competition = await fetchChallenge(id)

  if (!competition) {
    notFound()
  }

  const submissions = await fetchSubmissions({ challenge_id: id })
  const approvedSubmissions = submissions.filter((s: any) => s.status === "approved")
  const pendingSubmissions = submissions.filter((s: any) => s.status === "pending")
  const rejectedSubmissions = submissions.filter((s: any) => s.status === "rejected")

  // Calculate average score
  const scoredSubmissions = submissions.filter((s: any) => s.score !== null)
  const avgScore =
    scoredSubmissions.length > 0
      ? Math.round(scoredSubmissions.reduce((acc: number, s: any) => acc + s.score, 0) / scoredSubmissions.length)
      : 0

  // Top submissions
  const topSubmissions = [...submissions]
    .filter((s: any) => s.score !== null)
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, 5)

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className={`${statusColors[competition.status as keyof typeof statusColors]} mb-3`}>
            {competition.status}
          </Badge>
          <h1 className="text-4xl font-bold mb-2 text-balance">{competition.title}</h1>
          <p className="text-lg text-muted-foreground">{competition.description}</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Total Submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{submissions.length}</p>
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
              <p className="text-3xl font-bold text-green-500">{approvedSubmissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-yellow-500" />
                Pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">{pendingSubmissions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Avg Score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{avgScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Prize Pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">${competition.prize_pool?.toLocaleString() || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Submissions List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>Review all entries for this competition</CardDescription>
              </CardHeader>
              <CardContent>
                {submissions.length > 0 ? (
                  <div className="space-y-4">
                    {submissions.map((submission: any) => (
                      <div
                        key={submission.id}
                        className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{submission.challenge_title}</h4>
                            <p className="text-sm text-muted-foreground">
                              Submitted {formatDistanceToNow(new Date(submission.submitted_at), { addSuffix: true })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {submission.score !== null && (
                              <Badge variant="secondary" className="font-semibold">
                                {submission.score}/100
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={
                                submission.status === "approved"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : submission.status === "pending"
                                    ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                              }
                            >
                              {submission.status}
                            </Badge>
                          </div>
                        </div>
                        {submission.feedback && (
                          <p className="text-sm text-muted-foreground mb-3">{submission.feedback}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={submission.github_url} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4 mr-2" />
                              Code
                            </a>
                          </Button>
                          {submission.demo_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={submission.demo_url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Demo
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No submissions yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Submissions */}
            <Card>
              <CardHeader>
                <CardTitle>Top Submissions</CardTitle>
                <CardDescription>Highest scoring entries</CardDescription>
              </CardHeader>
              <CardContent>
                {topSubmissions.length > 0 ? (
                  <div className="space-y-3">
                    {topSubmissions.map((submission: any, index: number) => (
                      <div key={submission.id} className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{submission.challenge_title}</p>
                          <p className="text-xs text-muted-foreground truncate">Submission</p>
                        </div>
                        <Badge variant="secondary" className="font-semibold">
                          {submission.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No scored submissions yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Competition Info */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Start:</span>
                  <span className="font-medium">{format(new Date(competition.start_date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">End:</span>
                  <span className="font-medium">{format(new Date(competition.end_date), "MMM d, yyyy")}</span>
                </div>
                {competition.status === "active" && (
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ends:</span>
                    <span className="font-medium">
                      {formatDistanceToNow(new Date(competition.end_date), { addSuffix: true })}
                    </span>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Challenges</p>
                  <p className="text-2xl font-bold">{competition.challenges?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
