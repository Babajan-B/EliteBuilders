"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Trophy,
  FileText,
  TrendingUp,
  User,
  Settings,
} from "lucide-react"

interface DashboardNavProps {
  className?: string
}

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Competitions",
    href: "/competitions",
    icon: Trophy,
  },
  {
    title: "My Submissions",
    href: "/my-submissions",
    icon: FileText,
  },
  {
    title: "Leaderboard",
    href: "/leaderboard",
    icon: TrendingUp,
  },
  {
    title: "Profile",
    href: "/profile",
    icon: User,
  },
]

export function DashboardNav({ className }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center space-x-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap",
                  "hover:bg-muted hover:text-foreground",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
