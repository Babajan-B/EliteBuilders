"use client"

import { useEffect, useState } from "react"
import { CompetitionCard } from "@/components/competitions/competition-card"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Zap, Target } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Competition {
  id: string
  title: string
  description: string
  status: "active" | "upcoming" | "completed"
  prize_pool?: number
  start_date: string
  end_date: string
  difficulty?: string
  tags?: string[]
}

export default function HomePage() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    async function loadCompetitions() {
      console.log("🏠 HOME: Starting to load competitions...")
      try {
        console.log("📡 HOME: Querying Supabase challenges table...")
        const { data, error } = await supabase
          .from("challenges")
          .select("*")
          .order("created_at", { ascending: false })

        console.log("📊 HOME: Query result:", { hasData: !!data, dataLength: data?.length, hasError: !!error })

        if (error) {
          console.error("❌ HOME: Supabase error:", error)
          setLoading(false)
          return
        }

        if (data) {
          console.log("✅ HOME: Raw data received:", data.length, "challenges")
          console.log("🔍 HOME: First challenge sample:", data[0])
          
          // Map backend data to frontend format
          const formattedData = data.map((challenge: any) => {
            // Extract prize amount from prize_md if it exists
            let prize_pool = challenge.prize_pool || 0
            if (!prize_pool && challenge.prize_md) {
              const match = challenge.prize_md.match(/\$?([\d,]+)/)
              if (match) {
                prize_pool = parseFloat(match[1].replace(/,/g, ''))
              }
            }

            return {
              id: challenge.id,
              title: challenge.title,
              description: challenge.brief_md?.substring(0, 150) + "..." || "",
              status: (challenge.is_active ? "active" : "completed") as "active" | "upcoming" | "completed",
              prize_pool: prize_pool,
              start_date: challenge.created_at,
              end_date: challenge.deadline_utc,
              difficulty: challenge.difficulty || "medium",
              tags: challenge.tags || [],
            }
          })
          console.log("✅ HOME: Formatted data:", formattedData.length, "competitions")
          console.log("🎯 HOME: Active:", formattedData.filter(c => c.status === 'active').length)
          console.log("🎯 HOME: Completed:", formattedData.filter(c => c.status === 'completed').length)
          setCompetitions(formattedData)
        } else {
          console.warn("⚠️ HOME: No data returned from Supabase")
        }
      } catch (error) {
        console.error("❌ HOME: Error loading competitions:", error)
      } finally {
        console.log("✅ HOME: Loading complete")
        setLoading(false)
      }
    }

    loadCompetitions()
  }, [supabase])

  const activeCompetitions = competitions.filter((c) => c.status === "active")
  const upcomingCompetitions = competitions.filter((c) => c.status === "upcoming")
  const completedCompetitions = competitions.filter((c) => c.status === "completed")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="relative border-b border-border overflow-hidden">
        {/* Background gradient effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

        <div className="container relative mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              <span>Join 10,000+ competitive builders</span>
            </div>

            {/* Main heading */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
              Build. Compete.{" "}
              <span className="text-primary bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Win Big.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-muted-foreground text-pretty leading-relaxed max-w-2xl mx-auto">
              The premier platform where elite developers compete in real-world challenges, earn recognition from top
              companies, and win substantial prizes.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-6">
              <Button size="lg" className="text-base px-8" asChild>
                <a href="#competitions">
                  <Trophy className="mr-2 h-5 w-5" />
                  Explore Competitions
                </a>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 bg-transparent" asChild>
                <a href="/leaderboard">View Leaderboard</a>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-primary">$500K+</div>
                <div className="text-sm text-muted-foreground">Total Prizes</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-primary">150+</div>
                <div className="text-sm text-muted-foreground">Competitions</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl md:text-4xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Sponsors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Compete for Prizes</h3>
              <p className="text-muted-foreground leading-relaxed">
                Win cash prizes and recognition from top sponsors in the industry.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Real-World Challenges</h3>
              <p className="text-muted-foreground leading-relaxed">
                Solve practical problems and build projects that matter.
              </p>
            </div>
            <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-card border border-border">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Expert Judging</h3>
              <p className="text-muted-foreground leading-relaxed">
                Get feedback from industry professionals and improve your skills.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Competitions */}
      <section id="competitions" className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-2">Competitions</h2>
            <p className="text-muted-foreground">Browse active and upcoming competitions to showcase your skills</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="active">Active ({activeCompetitions.length})</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming ({upcomingCompetitions.length})</TabsTrigger>
                <TabsTrigger value="completed">Completed ({completedCompetitions.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-6">
                {activeCompetitions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeCompetitions.map((competition) => (
                      <CompetitionCard key={competition.id} competition={competition} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No active competitions at the moment. Check back soon!
                  </div>
                )}
              </TabsContent>

              <TabsContent value="upcoming" className="space-y-6">
                {upcomingCompetitions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {upcomingCompetitions.map((competition) => (
                      <CompetitionCard key={competition.id} competition={competition} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No upcoming competitions scheduled yet.</div>
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-6">
                {completedCompetitions.length > 0 ? (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {completedCompetitions.map((competition) => (
                      <CompetitionCard key={competition.id} competition={competition} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">No completed competitions yet.</div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      </section>
    </div>
  )
}
