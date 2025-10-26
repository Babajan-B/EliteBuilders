import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"

// Force dynamic rendering - no caching (server component)
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Trophy, Users, Clock, Building2, FileText } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { notFound } from "next/navigation"
import { fetchChallenge, fetchSubmissions } from "@/lib/api-client"

export default async function CompetitionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch competition from backend API
  const competition = await fetchChallenge(id)

  if (!competition) {
    notFound()
  }

  // Fetch submissions for this competition
  const submissions = await fetchSubmissions({ challenge_id: id })
  const submissionCount = submissions.length

  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  const endDate = new Date(competition.end_date)
  const startDate = new Date(competition.start_date)
  const timeRemaining = competition.status === "active" ? formatDistanceToNow(endDate, { addSuffix: true }) : null

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <Badge
                variant="outline"
                className={`${statusColors[competition.status as keyof typeof statusColors]} mb-3`}
              >
                {competition.status}
              </Badge>
              <h1 className="text-4xl font-bold mb-2 text-balance">{competition.title}</h1>
              {competition.sponsor_name && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <span>Sponsored by {competition.sponsor_name}</span>
                </div>
              )}
            </div>
            {competition.status === "active" && (
              <Button size="lg" asChild>
                <Link href={`/submit/${id}`}>Submit Entry</Link>
              </Button>
            )}
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">{competition.description}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground leading-relaxed">{competition.description}</p>
                </div>

                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Rules & Guidelines</h3>
                  <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                    <li>All submissions must be original work</li>
                    <li>Code must be publicly accessible via GitHub</li>
                    <li>Submissions must be completed before the deadline</li>
                    <li>Follow best practices and include documentation</li>
                  </ul>
                </div>

                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Judging Criteria</h3>
                  <ul className="text-muted-foreground leading-relaxed space-y-2 list-disc list-inside">
                    <li>Code quality and organization (30%)</li>
                    <li>Functionality and completeness (40%)</li>
                    <li>Innovation and creativity (20%)</li>
                    <li>Documentation and presentation (10%)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Challenges */}
            {competition.challenges && competition.challenges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Challenges</CardTitle>
                  <CardDescription>Complete these challenges to earn points</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {competition.challenges.map((challenge: any) => (
                    <div
                      key={challenge.id}
                      className="p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <Badge variant="secondary">{challenge.points} pts</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Competition Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {competition.prize_pool && (
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prize Pool</p>
                      <p className="text-xl font-bold">${competition.prize_pool.toLocaleString()}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="text-xl font-bold">{submissionCount || 0}</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Start:</span>
                    <span className="font-medium">{format(startDate, "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">End:</span>
                    <span className="font-medium">{format(endDate, "MMM d, yyyy")}</span>
                  </div>
                  {timeRemaining && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Ends:</span>
                      <span className="font-medium">{timeRemaining}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
          </div>
        </div>
      </div>
    </div>
  )
}
