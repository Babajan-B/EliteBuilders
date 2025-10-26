"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/layout/header"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Trophy,
  Calendar,
  DollarSign,
  Search,
  Filter,
  Clock,
  Target,
  ArrowRight,
  TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Competition {
  id: string
  title: string
  description: string
  prize_pool: number
  start_date: string
  end_date: string
  difficulty: string
  is_active: boolean
  tags: string[]
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [filteredCompetitions, setFilteredCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all")
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function loadCompetitions() {
      console.log("🔄 Starting to load competitions...")
      try {
        console.log("📡 Querying Supabase...")
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("❌ Supabase error:", error)
          setLoading(false)
          return
        }

        console.log("✅ Supabase response:", { dataCount: data?.length, hasData: !!data })

        if (data) {
          console.log("Raw challenges data:", data)
          const formattedData: Competition[] = data.map((challenge: any) => {
            // Try prize_pool first, then extract from prize_md
            let prize_pool = challenge.prize_pool || 0
            if (!prize_pool && challenge.prize_md) {
              const match = challenge.prize_md.match(/\$?(\d+(?:,\d+)*(?:\.\d+)?)/)
              if (match) {
                prize_pool = parseFloat(match[1].replace(/,/g, ''))
              }
            }

            return {
              id: challenge.id,
              title: challenge.title,
              description: challenge.brief_md?.substring(0, 200) + "..." || "",
              prize_pool: prize_pool,
              start_date: challenge.created_at,
              end_date: challenge.deadline_utc,
              difficulty: challenge.difficulty || "medium",
              is_active: challenge.is_active,
              tags: challenge.tags || [],
            }
          })
          console.log("✅ Formatted competitions:", formattedData.length, "competitions")
          console.log("Sample competition:", formattedData[0])
          setCompetitions(formattedData)
          setFilteredCompetitions(formattedData)
        } else {
          console.log("⚠️ No data returned from Supabase")
        }
      } catch (error) {
        console.error("❌ Error loading competitions:", error)
      } finally {
        console.log("✅ Loading complete")
        setLoading(false)
      }
    }

    loadCompetitions()
  }, [supabase])

  // Filter competitions based on search and difficulty
  useEffect(() => {
    let filtered = competitions

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (comp) =>
          comp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          comp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((comp) => comp.difficulty === difficultyFilter)
    }

    setFilteredCompetitions(filtered)
  }, [searchQuery, difficultyFilter, competitions])

  const difficultyColors = {
    easy: "bg-green-500/10 text-green-500 border-green-500/20",
    medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    hard: "bg-red-500/10 text-red-500 border-red-500/20",
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="ml-4 text-muted-foreground">Loading competitions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DashboardNav />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Trophy className="h-10 w-10 text-primary" />
            Active Competitions
          </h1>
          <p className="text-lg text-muted-foreground">
            Browse {competitions.length} active competitions and showcase your skills
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Total Prize Pool
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">
                ${competitions.reduce((sum, c) => sum + c.prize_pool, 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Active Challenges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{competitions.length}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Avg Prize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                ${Math.round(competitions.reduce((sum, c) => sum + c.prize_pool, 0) / competitions.length).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search competitions by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant={difficultyFilter === "all" ? "default" : "outline"}
              onClick={() => setDifficultyFilter("all")}
              size="sm"
            >
              <Filter className="h-4 w-4 mr-2" />
              All
            </Button>
            <Button
              variant={difficultyFilter === "easy" ? "default" : "outline"}
              onClick={() => setDifficultyFilter("easy")}
              size="sm"
            >
              Easy
            </Button>
            <Button
              variant={difficultyFilter === "medium" ? "default" : "outline"}
              onClick={() => setDifficultyFilter("medium")}
              size="sm"
            >
              Medium
            </Button>
            <Button
              variant={difficultyFilter === "hard" ? "default" : "outline"}
              onClick={() => setDifficultyFilter("hard")}
              size="sm"
            >
              Hard
            </Button>
          </div>
        </div>

        {/* Competitions Grid */}
        {filteredCompetitions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCompetitions.map((competition) => (
              <Card
                key={competition.id}
                className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      Active
                    </Badge>
                    <Badge
                      variant="outline"
                      className={difficultyColors[competition.difficulty as keyof typeof difficultyColors]}
                    >
                      {competition.difficulty}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl line-clamp-2 group-hover:text-primary transition-colors">
                    {competition.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 mt-2">
                    {competition.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Prize Pool */}
                  <div className="flex items-center gap-2 text-primary">
                    <DollarSign className="h-5 w-5" />
                    <span className="text-2xl font-bold">
                      ${competition.prize_pool.toLocaleString()}
                    </span>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      Ends {formatDistanceToNow(new Date(competition.end_date), { addSuffix: true })}
                    </span>
                  </div>

                  {/* Tags */}
                  {competition.tags && competition.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {competition.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {competition.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{competition.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button asChild className="flex-1">
                      <Link href={`/competitions/${competition.id}`}>
                        View Details
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <Link href={`/submit/${competition.id}`}>
                        <Trophy className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No competitions found</h3>
              <p className="text-muted-foreground">
                {searchQuery || difficultyFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Check back soon for new competitions"}
              </p>
              {!loading && competitions.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Note: Make sure there are active challenges in the database
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
