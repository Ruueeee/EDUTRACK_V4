"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  BookOpen,
  LayoutDashboard,
  GraduationCap,
  ListChecks,
  StickyNote,
  Activity,
  Users,
  ScrollText,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { AppRole } from "@/lib/auth"

interface NavItem {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
}

const STUDENT_NAV: NavItem[] = [
  { href: "/student", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/student/courses", label: "My Courses", Icon: GraduationCap },
  { href: "/student/tasks", label: "Task Tracker", Icon: ListChecks },
  { href: "/student/notes", label: "Self-Notes", Icon: StickyNote },
  { href: "/student/activity", label: "Activity Log", Icon: Activity },
]

const INSTRUCTOR_NAV: NavItem[] = [
  { href: "/instructor", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/instructor/courses", label: "My Courses", Icon: GraduationCap },
]

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/logs", label: "Activity Logs", Icon: ScrollText },
]

const ROLE_LABEL: Record<AppRole, string> = {
  STUDENT: "Student",
  INSTRUCTOR: "Instructor",
  ADMIN: "Admin",
}

const ROLE_TEXT: Record<AppRole, string> = {
  STUDENT: "text-gray-700",
  INSTRUCTOR: "text-blue-700",
  ADMIN: "text-purple-700",
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role: AppRole }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const nav =
    user.role === "INSTRUCTOR" ? INSTRUCTOR_NAV : user.role === "ADMIN" ? ADMIN_NAV : STUDENT_NAV

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <BookOpen className="h-5 w-5" />
        <span className="font-semibold">EduTrack</span>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {nav.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active && "bg-accent text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-3">
        <div className="px-2 pb-2">
          <p className="truncate text-sm font-medium">{user.name ?? user.email}</p>
          <p className={cn("text-xs font-medium", ROLE_TEXT[user.role])}>
            {ROLE_LABEL[user.role]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
