"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  UserPlus,
  Building2,
  Gavel
} from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"

interface Invitation {
  id: string
  email: string
  role: string
  status: string
  created_at: string
  expires_at: string
  accepted_at?: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [sendingInvite, setSendingInvite] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Invitation form state
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"judge" | "sponsor">("judge")
  const [inviteName, setInviteName] = useState("")

  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "admin")) {
      router.push("/")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && user.role === "admin") {
      fetchInvitations()
    }
  }, [user])

  async function fetchInvitations() {
    try {
      const response = await fetch("/api/admin/invite")
      if (response.ok) {
        const data = await response.json()
        if (data.ok) {
          setInvitations(data.data || [])
        }
      }
    } catch (error) {
      console.error("Error fetching invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSendInvite(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setSendingInvite(true)

    try {
      const response = await fetch("/api/admin/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          name: inviteName || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok && data.ok) {
        setSuccess(`Invitation sent successfully to ${inviteEmail}!`)
        setInviteEmail("")
        setInviteName("")
        setInviteRole("judge")
        await fetchInvitations()
      } else {
        setError(data.error?.message || "Failed to send invitation")
      }
    } catch (error) {
      console.error("Error sending invitation:", error)
      setError("Failed to send invitation. Please try again.")
    } finally {
      setSendingInvite(false)
    }
  }

  if (authLoading || loading) {
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

  if (!user || user.role !== "admin") {
    return null
  }

  const pendingInvitations = invitations.filter(i => i.status === "pending")
  const acceptedInvitations = invitations.filter(i => i.status === "accepted")
  const expiredInvitations = invitations.filter(i => i.status === "expired")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
            <Shield className="h-10 w-10 text-primary" />
            Admin Panel
          </h1>
          <p className="text-lg text-muted-foreground">
            Manage invitations, users, and platform settings
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Total Invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{invitations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Pending
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-500">{pendingInvitations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Accepted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-500">{acceptedInvitations.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Expired
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-500">{expiredInvitations.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="send-invite" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="send-invite">
              <UserPlus className="h-4 w-4 mr-2" />
              Send Invitation
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending ({pendingInvitations.length})
            </TabsTrigger>
            <TabsTrigger value="all">
              All ({invitations.length})
            </TabsTrigger>
          </TabsList>

          {/* Send Invitation Tab */}
          <TabsContent value="send-invite">
            <Card>
              <CardHeader>
                <CardTitle>Send Invitation</CardTitle>
                <CardDescription>
                  Invite judges or sponsors to join the EliteBuilders platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendInvite} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(value: "judge" | "sponsor") => setInviteRole(value)}>
                        <SelectTrigger id="role">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="judge">
                            <div className="flex items-center gap-2">
                              <Gavel className="h-4 w-4" />
                              Judge
                            </div>
                          </SelectItem>
                          <SelectItem value="sponsor">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Sponsor
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name">Name (Optional)</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Recipient's name"
                        value={inviteName}
                        onChange={(e) => setInviteName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="recipient@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="bg-green-500/10 text-green-600 px-4 py-3 rounded-md">
                      {success}
                    </div>
                  )}

                  <Button type="submit" disabled={sendingInvite} className="w-full">
                    {sendingInvite ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pending Invitations Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingInvitations.length > 0 ? (
              pendingInvitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{invitation.email}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant={invitation.role === "judge" ? "default" : "secondary"}>
                            {invitation.role === "judge" ? (
                              <><Gavel className="h-3 w-3 mr-1" /> Judge</>
                            ) : (
                              <><Building2 className="h-3 w-3 mr-1" /> Sponsor</>
                            )}
                          </Badge>
                          <span>
                            Sent: {new Date(invitation.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-yellow-500">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  No pending invitations.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* All Invitations Tab */}
          <TabsContent value="all" className="space-y-4">
            {invitations.length > 0 ? (
              invitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">{invitation.email}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <Badge variant={invitation.role === "judge" ? "default" : "secondary"}>
                            {invitation.role === "judge" ? (
                              <><Gavel className="h-3 w-3 mr-1" /> Judge</>
                            ) : (
                              <><Building2 className="h-3 w-3 mr-1" /> Sponsor</>
                            )}
                          </Badge>
                          <span>
                            Sent: {new Date(invitation.created_at).toLocaleDateString()}
                          </span>
                          {invitation.accepted_at && (
                            <span>
                              Accepted: {new Date(invitation.accepted_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge
                        className={
                          invitation.status === "accepted"
                            ? "bg-green-500"
                            : invitation.status === "expired"
                            ? "bg-red-500"
                            : "bg-yellow-500"
                        }
                      >
                        {invitation.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12 text-muted-foreground">
                  No invitations yet. Send your first invitation using the "Send Invitation" tab.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
