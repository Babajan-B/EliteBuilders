"use client"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Trophy, User, LogOut, Gavel, Building2, FileText, Shield } from "lucide-react"

export function Header() {
  const { user, loading, signOut } = useAuth()

  // Debug: Log user state
  if (user) {
    console.log("Header: User loaded:", { email: user.email, role: user.role, name: user.name })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-xl">
          <Trophy className="h-6 w-6 text-primary" />
          <span>EliteBuilders</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Competitions
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Leaderboard
          </Link>
          {user?.role === "builder" && (
            <Link
              href="/my-submissions"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              My Submissions
            </Link>
          )}
          {user?.role === "judge" && (
            <Link
              href="/judge"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Judge Console
            </Link>
          )}
          {user?.role === "sponsor" && (
            <Link
              href="/sponsor"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Sponsor Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {loading ? (
            <div className="h-9 w-20 animate-pulse bg-muted rounded-md" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">{user.name || user.email}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                {user.role === "builder" && (
                  <DropdownMenuItem asChild>
                    <Link href="/my-submissions" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      My Submissions
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "judge" && (
                  <DropdownMenuItem asChild>
                    <Link href="/judge" className="flex items-center gap-2">
                      <Gavel className="h-4 w-4" />
                      Judge Console
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "sponsor" && (
                  <DropdownMenuItem asChild>
                    <Link href="/sponsor" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Sponsor Dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Edit Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
