import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Trophy, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CompetitionCardProps {
  competition: {
    id: string
    title: string
    description: string
    status: "upcoming" | "active" | "completed"
    start_date: string
    end_date: string
    prize_pool?: number
    participant_count?: number
    sponsor_name?: string
  }
}

export function CompetitionCard({ competition }: CompetitionCardProps) {
  const statusColors = {
    upcoming: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    active: "bg-green-500/10 text-green-500 border-green-500/20",
    completed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  }

  const endDate = new Date(competition.end_date)
  const isValidDate = !isNaN(endDate.getTime())
  const timeRemaining =
    competition.status === "active" && isValidDate 
      ? `Ends ${formatDistanceToNow(endDate, { addSuffix: true })}` 
      : competition.status === "active" 
        ? "Ending soon"
        : null

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/50">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl group-hover:text-primary transition-colors">{competition.title}</CardTitle>
            {competition.sponsor_name && (
              <p className="text-sm text-muted-foreground mt-1">Sponsored by {competition.sponsor_name}</p>
            )}
          </div>
          <Badge variant="outline" className={statusColors[competition.status]}>
            {competition.status}
          </Badge>
        </div>
        <CardDescription className="line-clamp-2 mt-2">{competition.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {competition.prize_pool && (
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground">${competition.prize_pool.toLocaleString()}</span>
            </div>
          )}
          {competition.participant_count !== undefined && (
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{competition.participant_count} participants</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{timeRemaining || "Completed"}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href={`/competitions/${competition.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
