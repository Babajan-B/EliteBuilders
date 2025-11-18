"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Trophy, Users, CheckCircle2, Plus, Eye, XCircle,
  Calendar, Star, Download, Mail, ExternalLink,
  Github, Linkedin, FileText, AlertCircle, RefreshCcw
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { useAuth } from "@/components/auth/auth-provider"

export default function SponsorDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading, error: authError, retryAuth } = useAuth()
  const supabase = getSupabaseBrowserClient()

  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<any>(null)
  const [challenges, setChallenges] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("overview")
  
  const [showNewChallenge, setShowNewChallenge] = useState(false)
  const [newChallenge, setNewChallenge] = useState({
    title: "",
    description: "",
    deadline: "",
    prize_info: "",
    tags: ""
  })

  useEffect(() => {
    if (user) {
      fetchSponsorData()
    }
  }, [user])

  async function fetchSponsorData() {
    try {
      // Get sponsor organization using the correct table name
      const { data: sponsorOrgs } = await supabase
        .from("sponsor_orgs")
        .select("*")
        .eq("owner_profile_id", user?.id)
        .single()

      if (sponsorOrgs) {
        setOrganization(sponsorOrgs)
        
        const { data: challengesData } = await supabase
          .from("challenges")
          .select(`
            *,
            profiles:assigned_judge_id(id, display_name, email)
          `)
          .eq("sponsor_org_id", sponsorOrgs.id)
          .order("created_at", { ascending: false })

        setChallenges(challengesData || [])

        if (challengesData && challengesData.length > 0) {
          const challengeIds = challengesData.map((c: any) => c.id)
          const { data: submissionsData } = await supabase
            .from("submissions")
            .select(`
              *,
              challenges(id, title),
              profiles:user_id(id, display_name, email, github_url, linkedin_url, avatar_url)
            `)
            .in("challenge_id", challengeIds)
            .order("created_at", { ascending: false })

          setSubmissions(submissionsData || [])
        }

        const { data: favoritesData } = await supabase
          .from("sponsor_favorites")
          .select(`
            *,
            submissions(
              *,
              challenges(id, title),
              profiles:user_id(id, display_name, email)
            )
          `)
          .eq("sponsor_id", user?.id)

        setFavorites(favoritesData || [])

        const { data: teamData } = await supabase
          .from("sponsor_members")
          .select("*, profiles(id, display_name, email, avatar_url)")
          .eq("sponsor_org_id", sponsorOrgs.id)

        setTeamMembers(teamData || [])
      }
    } catch (error) {
      console.error("Error fetching sponsor data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateChallenge() {
    console.log("Form validation check:", {
      organization: organization ? "exists" : "missing",
      title: newChallenge.title || "EMPTY",
      description: newChallenge.description || "EMPTY",
      deadline: newChallenge.deadline || "EMPTY"
    })

    if (!organization) {
      alert("Organization not found. Please refresh the page.")
      return
    }

    if (!newChallenge.title || !newChallenge.title.trim()) {
      alert("Please enter a challenge title")
      return
    }

    if (!newChallenge.description || !newChallenge.description.trim()) {
      alert("Please enter a challenge description")
      return
    }

    if (!newChallenge.deadline) {
      alert("Please select a deadline")
      return
    }

    try {
      console.log("Creating challenge with data:", {
        title: newChallenge.title,
        brief_md: newChallenge.description,
        description: newChallenge.description,
        rubric_json: { criteria: [] },
        deadline_utc: new Date(newChallenge.deadline).toISOString(),
        prize_md: newChallenge.prize_info || null,
        tags: newChallenge.tags.split(",").map(t => t.trim()).filter(Boolean),
        sponsor_org_id: organization.id,
        is_active: true
      })

      const { data, error } = await supabase
        .from("challenges")
        .insert({
          title: newChallenge.title,
          brief_md: newChallenge.description,
          description: newChallenge.description,
          rubric_json: { criteria: [] }, // Default empty rubric
          deadline_utc: new Date(newChallenge.deadline).toISOString(),
          prize_md: newChallenge.prize_info || null,
          tags: newChallenge.tags.split(",").map(t => t.trim()).filter(Boolean),
          sponsor_org_id: organization.id,
          is_active: true
        })
        .select()

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw new Error(error.message || error.details || "Database error")
      }

      console.log("Challenge created successfully:", data)
      setShowNewChallenge(false)
      setNewChallenge({ title: "", description: "", deadline: "", prize_info: "", tags: "" })
      fetchSponsorData()
      alert("Challenge created successfully!")
    } catch (error) {
      console.error("Full error object:", error)
      const errorMessage = error instanceof Error ? error.message : JSON.stringify(error)
      alert(`Failed to create challenge: ${errorMessage}`)
    }
  }

  async function toggleFavorite(submissionId: string) {
    const isFavorited = favorites.some(f => f.submission_id === submissionId)

    if (isFavorited) {
      await supabase
        .from("sponsor_favorites")
        .delete()
        .eq("sponsor_id", user?.id)
        .eq("submission_id", submissionId)
    } else {
      await supabase
        .from("sponsor_favorites")
        .insert({
          sponsor_id: user?.id,
          submission_id: submissionId
        })
    }

    fetchSponsorData()
  }

  async function closeChallenge(challengeId: string) {
    await supabase
      .from("challenges")
      .update({ is_active: false, status: "closed" })
      .eq("id", challengeId)

    fetchSponsorData()
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

  const activeChallenges = challenges.filter(c => c.is_active)
  const closedChallenges = challenges.filter(c => !c.is_active)
  const totalSubmissions = submissions.length
  const finalizedSubmissions = submissions.filter(s => s.status === "FINAL" || s.status === "REVIEWED")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {organization && (
          <Card className="mb-8 bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {organization.logo_url && (
                    <img src={organization.logo_url} alt={organization.org_name} className="h-16 w-16 rounded-lg" />
                  )}
                  <div>
                    <CardTitle className="text-2xl">{organization.org_name}</CardTitle>
                    {organization.website && (
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {organization.website}
                      </a>
                    )}
                  </div>
                </div>
                <Button onClick={() => setShowNewChallenge(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Post New Challenge
                </Button>
              </div>
              {organization.description && (
                <CardDescription className="mt-2">{organization.description}</CardDescription>
              )}
            </CardHeader>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="challenges">Challenges</TabsTrigger>
            <TabsTrigger value="submissions">Submissions</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-green-500" />
                    Active Challenges
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{activeChallenges.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Total Submissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{totalSubmissions}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                    Finalized
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">{finalizedSubmissions.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Challenges</CardTitle>
                <CardDescription>Manage your posted challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Challenge</th>
                        <th className="text-left p-3">Deadline</th>
                        <th className="text-center p-3">Submissions</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {challenges.slice(0, 5).map((challenge) => {
                        const challengeSubmissions = submissions.filter(s => s.challenge_id === challenge.id)
                        return (
                          <tr key={challenge.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div>
                                <p className="font-medium">{challenge.title}</p>
                                {challenge.tags && challenge.tags.length > 0 && (
                                  <div className="flex gap-1 mt-1">
                                    {challenge.tags.slice(0, 3).map((tag: string, i: number) => (
                                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              {challenge.deadline_utc ? (
                                <span className="text-sm flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(challenge.deadline_utc), "MMM dd, yyyy")}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">No deadline</span>
                              )}
                            </td>
                            <td className="text-center p-3">
                              <Badge variant="secondary">{challengeSubmissions.length}</Badge>
                            </td>
                            <td className="text-center p-3">
                              <Badge variant={challenge.is_active ? "default" : "secondary"}>
                                {challenge.is_active ? "Active" : "Closed"}
                              </Badge>
                            </td>
                            <td className="text-right p-3">
                              <div className="flex gap-2 justify-end">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setActiveTab("challenges")}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                                {challenge.is_active && (
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => closeChallenge(challenge.id)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {challenges.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No challenges yet. Create your first challenge!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>All Challenges</CardTitle>
                    <CardDescription>View and manage your challenges</CardDescription>
                  </div>
                  <Button onClick={() => setShowNewChallenge(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Challenge
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active">
                  <TabsList>
                    <TabsTrigger value="active">Active ({activeChallenges.length})</TabsTrigger>
                    <TabsTrigger value="closed">Closed ({closedChallenges.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="active" className="space-y-4 mt-4">
                    {activeChallenges.map((challenge) => (
                      <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge} 
                        submissions={submissions.filter(s => s.challenge_id === challenge.id)}
                        onClose={() => closeChallenge(challenge.id)}
                      />
                    ))}
                    {activeChallenges.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No active challenges</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="closed" className="space-y-4 mt-4">
                    {closedChallenges.map((challenge) => (
                      <ChallengeCard 
                        key={challenge.id} 
                        challenge={challenge} 
                        submissions={submissions.filter(s => s.challenge_id === challenge.id)}
                      />
                    ))}
                    {closedChallenges.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No closed challenges</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>View submissions across all your challenges</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Candidate</th>
                        <th className="text-left p-3">Challenge</th>
                        <th className="text-center p-3">Score</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Judge</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((submission) => (
                        <SubmissionRow
                          key={submission.id}
                          submission={submission}
                          isFavorited={favorites.some(f => f.submission_id === submission.id)}
                          onToggleFavorite={() => toggleFavorite(submission.id)}
                        />
                      ))}
                    </tbody>
                  </table>
                  {submissions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No submissions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Favorites / Shortlist</CardTitle>
                    <CardDescription>Your saved candidates</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Candidate</th>
                        <th className="text-left p-3">Challenge</th>
                        <th className="text-center p-3">Final Score</th>
                        <th className="text-left p-3">Note</th>
                        <th className="text-right p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {favorites.map((favorite) => (
                        <tr key={favorite.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {favorite.submissions?.profiles?.display_name?.[0] || "?"}
                              </div>
                              <div>
                                <p className="font-medium">{favorite.submissions?.profiles?.display_name || "Unknown"}</p>
                                <p className="text-xs text-muted-foreground">{favorite.submissions?.profiles?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{favorite.submissions?.challenges?.title}</p>
                          </td>
                          <td className="text-center p-3">
                            <Badge variant="secondary">
                              {favorite.submissions?.score_llm || favorite.submissions?.score || "N/A"}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <p className="text-sm text-muted-foreground">{favorite.note || "-"}</p>
                          </td>
                          <td className="text-right p-3">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => toggleFavorite(favorite.submission_id)}
                            >
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {favorites.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Star className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No favorites yet. Star submissions to add them here.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your organization's team</CardDescription>
                  </div>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Name</th>
                        <th className="text-left p-3">Role</th>
                        <th className="text-left p-3">Status</th>
                        <th className="text-left p-3">Joined On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                {member.profiles?.display_name?.[0] || member.email[0]}
                              </div>
                              <div>
                                <p className="font-medium">{member.profiles?.display_name || member.email}</p>
                                <p className="text-xs text-muted-foreground">{member.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{member.role}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={member.status === "accepted" ? "default" : "secondary"}>
                              {member.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <span className="text-sm text-muted-foreground">
                              {member.joined_at ? format(new Date(member.joined_at), "MMM dd, yyyy") : "-"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {teamMembers.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>No team members yet. Invite your first member!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showNewChallenge} onOpenChange={setShowNewChallenge}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Post New Challenge</DialogTitle>
              <DialogDescription>Create a new challenge for builders to participate</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Build an AI-powered chatbot"
                  value={newChallenge.title}
                  onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description * (Markdown supported)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the challenge, requirements, and evaluation criteria..."
                  rows={6}
                  value={newChallenge.description}
                  onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline *</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={newChallenge.deadline}
                    onChange={(e) => setNewChallenge({ ...newChallenge, deadline: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prize">Prize/Reward Info</Label>
                  <Input
                    id="prize"
                    placeholder="e.g., $5000 + Job Interview"
                    value={newChallenge.prize_info}
                    onChange={(e) => setNewChallenge({ ...newChallenge, prize_info: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., AI, Web Development, React"
                  value={newChallenge.tags}
                  onChange={(e) => setNewChallenge({ ...newChallenge, tags: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewChallenge(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateChallenge}>
                <Trophy className="h-4 w-4 mr-2" />
                Publish Challenge
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

function ChallengeCard({ challenge, submissions, onClose }: any) {
  const finalizedCount = submissions.filter((s: any) => s.status === "FINAL" || s.status === "REVIEWED").length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle>{challenge.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {challenge.description}
            </CardDescription>
            {challenge.tags && challenge.tags.length > 0 && (
              <div className="flex gap-1 mt-2">
                {challenge.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant={challenge.is_active ? "default" : "secondary"}>
            {challenge.is_active ? "Active" : "Closed"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Deadline</p>
            <p className="font-medium">
              {challenge.deadline_utc ? format(new Date(challenge.deadline_utc), "MMM dd, yyyy") : "No deadline"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submissions</p>
            <p className="font-medium">{submissions.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Finalized</p>
            <p className="font-medium">{finalizedCount}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Prize</p>
            <p className="font-medium text-sm">{challenge.prize_md || challenge.prize_info || "N/A"}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          <Button size="sm" variant="outline">
            <Download className="h-3 w-3 mr-1" />
            Export Leaderboard
          </Button>
          {challenge.is_active && onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <XCircle className="h-3 w-3 mr-1" />
              Close Challenge
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SubmissionRow({ submission, isFavorited, onToggleFavorite }: any) {
  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            {submission.profiles?.display_name?.[0] || "?"}
          </div>
          <div>
            <p className="font-medium">{submission.profiles?.display_name || "Unknown"}</p>
            <div className="flex gap-2 mt-1">
              {submission.profiles?.github_url && (
                <a href={submission.profiles.github_url} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </a>
              )}
              {submission.profiles?.linkedin_url && (
                <a href={submission.profiles.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </a>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="p-3">
        <p className="text-sm">{submission.challenges?.title}</p>
      </td>
      <td className="text-center p-3">
        <Badge variant="secondary">
          {submission.score_llm || submission.score || "N/A"}
        </Badge>
      </td>
      <td className="text-center p-3">
        <Badge 
          variant={
            submission.status === "FINAL" ? "default" :
            submission.status === "REVIEWED" ? "secondary" :
            "outline"
          }
        >
          {submission.status}
        </Badge>
      </td>
      <td className="text-center p-3">
        <span className="text-sm text-muted-foreground">
          {submission.assigned_judge_id ? "Assigned" : "-"}
        </span>
      </td>
      <td className="text-right p-3">
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="ghost" onClick={onToggleFavorite}>
            <Star className={`h-4 w-4 ${isFavorited ? "fill-yellow-500 text-yellow-500" : ""}`} />
          </Button>
          <Button size="sm" variant="outline">
            <Eye className="h-3 w-3 mr-1" />
            View
          </Button>
        </div>
      </td>
    </tr>
  )
}
