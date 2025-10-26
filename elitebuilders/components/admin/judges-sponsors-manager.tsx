"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { 
  Users, Gavel, Building2, Search, Mail, Calendar,
  CheckCircle, XCircle, Clock
} from "lucide-react"

interface User {
  id: string
  email: string
  role: string
  display_name: string | null
  created_at: string
}

export function JudgesSponsorsManager() {
  const [judges, setJudges] = useState<User[]>([])
  const [sponsors, setSponsors] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'judges' | 'sponsors'>('judges')

  useEffect(() => {
    fetchUsers()
  }, [])

  async function fetchUsers() {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setJudges(data.judges || [])
        setSponsors(data.sponsors || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const filteredJudges = judges.filter(judge =>
    judge.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    judge.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredSponsors = sponsors.filter(sponsor =>
    sponsor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sponsor.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentList = activeTab === 'judges' ? filteredJudges : filteredSponsors
  const totalCount = activeTab === 'judges' ? judges.length : sponsors.length

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'judges' ? 'border-primary ring-2 ring-primary/20' : ''}`}
          onClick={() => setActiveTab('judges')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Judges</CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{judges.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for submission review
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${activeTab === 'sponsors' ? 'border-primary ring-2 ring-primary/20' : ''}`}
          onClick={() => setActiveTab('sponsors')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sponsors</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sponsors.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Supporting the hackathon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main List Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {activeTab === 'judges' ? <Gavel className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
                {activeTab === 'judges' ? 'Judges' : 'Sponsors'}
              </CardTitle>
              <CardDescription>
                {activeTab === 'judges' 
                  ? 'Manage judges who can review submissions'
                  : 'View sponsors supporting the event'
                }
              </CardDescription>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading users...
            </div>
          ) : currentList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No {activeTab} found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {currentList.map((user) => (
                <UserCard key={user.id} user={user} role={activeTab} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Individual User Card Component
function UserCard({ user, role }: { user: User, role: 'judges' | 'sponsors' }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {user.display_name?.slice(0, 2).toUpperCase() || user.email.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{user.display_name || 'No name set'}</p>
            <Badge variant="outline" className="text-xs">
              {role === 'judges' ? <Gavel className="w-3 h-3 mr-1" /> : <Building2 className="w-3 h-3 mr-1" />}
              {user.role}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Mail className="w-3 h-3" />
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {role === 'judges' && (
        <Button variant="outline" size="sm">
          View Reviews
        </Button>
      )}
    </div>
  )
}
