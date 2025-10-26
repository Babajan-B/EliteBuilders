import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Force dynamic rendering - no caching (server component)
export const dynamic = 'force-dynamic'
export const revalidate = 0
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Trophy, Medal, Award, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { fetchChallenges, fetchLeaderboard } from "@/lib/api-client"
import Link from "next/link"

export default async function LeaderboardPage() {
  // Fetch all challenges
  const challenges = await fetchChallenges({ status: "active" })

  // Get first active challenge for leaderboard
  const firstChallenge = challenges.length > 0 ? challenges[0] : null

  // Fetch leaderboard if we have a challenge
  const leaderboardData = firstChallenge
    ? await fetchLeaderboard(firstChallenge.id)
    : []

  // Transform and sort by score
  const topBuilders = leaderboardData
    .sort((a, b) => (b.score_display || 0) - (a.score_display || 0))
    .map((entry, index) => ({
      id: entry.submission_id || entry.id,
      rank: index + 1,
      name: entry.display_name || entry.profile?.display_name || "Anonymous",
      email: entry.profile?.email || "",
      total_points: Math.round(entry.score_display || 0),
      submissions_count: 1, // Per challenge
    }))

  function getRankIcon(rank: number) {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return null
  }

  function getRankBadge(rank: number) {
    if (rank === 1) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    if (rank === 2) return "bg-gray-400/10 text-gray-400 border-gray-400/20"
    if (rank === 3) return "bg-amber-600/10 text-amber-600 border-amber-600/20"
    return ""
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Leaderboard</h1>
          <p className="text-lg text-muted-foreground">
            {firstChallenge
              ? `Top submissions for "${firstChallenge.title}"`
              : "Top builders ranked by total points earned"}
          </p>
        </div>

        {!firstChallenge && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Active Competitions</AlertTitle>
            <AlertDescription>
              There are currently no active competitions. Check back soon or{" "}
              <Link href="/" className="underline">
                browse all competitions
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {firstChallenge && topBuilders.length === 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Submissions Yet</AlertTitle>
            <AlertDescription>
              Be the first to submit! <Link href={`/competitions/${firstChallenge.id}`} className="underline">View competition details</Link>.
            </AlertDescription>
          </Alert>
        )}

        {/* Top 3 */}
        {topBuilders.length >= 3 && (
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {topBuilders.slice(0, 3).map((builder) => (
              <Card
                key={builder.id}
                className={`${builder.rank === 1 ? "md:order-2 border-primary" : builder.rank === 2 ? "md:order-1" : "md:order-3"}`}
              >
                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-2">{getRankIcon(builder.rank)}</div>
                  <Avatar className="h-16 w-16 mx-auto mb-2">
                    <AvatarFallback className="text-lg">{builder.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-lg">{builder.name}</CardTitle>
                  <CardDescription className="text-xs">{builder.email}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold text-primary mb-1">{builder.total_points}</p>
                  <p className="text-sm text-muted-foreground">{builder.submissions_count} submissions</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Rest of leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>All Rankings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {topBuilders.map((builder) => (
                <div key={builder.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-center w-12">
                    {builder.rank <= 3 ? (
                      getRankIcon(builder.rank)
                    ) : (
                      <span className="text-lg font-semibold text-muted-foreground">{builder.rank}</span>
                    )}
                  </div>

                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{builder.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{builder.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{builder.submissions_count} submissions</p>
                  </div>

                  <Badge variant="outline" className={`${getRankBadge(builder.rank)} font-semibold`}>
                    {builder.total_points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
