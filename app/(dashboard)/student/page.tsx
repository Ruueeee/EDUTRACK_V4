import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { StatusBadge } from "@/components/common/StatusBadge"
import { formatDate, formatDueDate, deadlineClass } from "@/lib/dates"
import { Megaphone, ListChecks } from "lucide-react"

export default async function StudentHomePage() {
  const session = await auth()
  const userId = session!.user.id

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [enrolledCount, assignments, recentAnnouncements, submittedThisWeek] = await Promise.all([
    prisma.enrollment.count({ where: { userId, course: { isArchived: false } } }),
    prisma.assignment.findMany({
      where: {
        course: { enrollments: { some: { userId } }, isArchived: false },
      },
      orderBy: { dueDate: "asc" },
      include: {
        course: { select: { id: true, title: true } },
        submissions: { where: { studentId: userId }, select: { status: true } },
      },
    }),
    prisma.announcement.findMany({
      where: { course: { enrollments: { some: { userId } } } },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { course: { select: { title: true, id: true } } },
    }),
    prisma.submission.count({
      where: { studentId: userId, submittedAt: { gte: weekAgo } },
    }),
  ])

  const pending = assignments.filter(
    (a) => a.submissions.length === 0 || a.submissions[0].status === "PENDING"
  ).length
  const upcoming = assignments
    .filter((a) => a.dueDate.getTime() > Date.now() - 24 * 60 * 60 * 1000)
    .slice(0, 3)

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Welcome back, ${session!.user.name ?? "student"}.`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Enrolled Courses" value={enrolledCount} />
        <StatCard label="Pending Tasks" value={pending} />
        <StatCard label="Submitted This Week" value={submittedThisWeek} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">Recent Announcements</h2>
          <Link href="/student/courses" className="text-xs text-muted-foreground hover:text-foreground">
            View courses
          </Link>
        </div>
        {recentAnnouncements.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            <Megaphone className="mx-auto mb-2 h-5 w-5" />
            No announcements yet.
          </div>
        ) : (
          <div className="space-y-3">
            {recentAnnouncements.map((a) => (
              <div key={a.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-medium">{a.title}</h3>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.course.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.body}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Upcoming Deadlines</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
            <ListChecks className="mx-auto mb-2 h-5 w-5" />
            No upcoming deadlines.
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => {
              const sub = a.submissions[0]
              return (
                <Link
                  key={a.id}
                  href={`/student/courses/${a.course.id}`}
                  className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium">{a.title}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.course.title}</p>
                    </div>
                    <StatusBadge status={sub?.status ?? "PENDING"} />
                  </div>
                  <p className={`mt-2 text-xs ${deadlineClass(a.dueDate, sub?.status)}`}>
                    {formatDueDate(a.dueDate)}
                  </p>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
