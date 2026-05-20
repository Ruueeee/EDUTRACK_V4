import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import type { SubmissionStatus } from "@prisma/client"

const STATUS_CLASS: Record<SubmissionStatus, string> = {
  PENDING: "bg-amber-500",
  SUBMITTED: "bg-blue-500",
  GRADED: "bg-green-500",
  LATE: "bg-red-500",
}

export default async function AdminHomePage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [totalUsers, totalCourses, totalSubmissions, byStatus, activeUsers] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.course.count(),
      prisma.submission.count(),
      prisma.submission.groupBy({
        by: ["status"],
        _count: { _all: true },
        orderBy: { status: "asc" },
      }),
      prisma.activityLog.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        distinct: ["userId"],
        select: { userId: true },
      }),
    ])

  const counts: Record<SubmissionStatus, number> = {
    PENDING: 0,
    SUBMITTED: 0,
    GRADED: 0,
    LATE: 0,
  }
  for (const row of byStatus) {
    const c = typeof row._count === "object" && row._count ? row._count._all ?? 0 : 0
    counts[row.status as SubmissionStatus] = c
  }
  const max = Math.max(1, ...Object.values(counts))

  return (
    <div className="space-y-6">
      <PageHeader title="Admin Dashboard" description="System-wide overview." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={totalUsers} />
        <StatCard label="Total Courses" value={totalCourses} />
        <StatCard label="Total Submissions" value={totalSubmissions} />
        <StatCard label="Active (7d)" value={activeUsers.length} />
      </div>

      <section className="rounded-lg border bg-card p-4 shadow-sm">
        <h2 className="text-sm font-medium">Submissions by status</h2>
        <div className="mt-4 space-y-3">
          {(Object.keys(counts) as SubmissionStatus[]).map((status) => {
            const count = counts[status]
            const pct = (count / max) * 100
            return (
              <div key={status}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium">{status}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted">
                  <div className={`h-full ${STATUS_CLASS[status]}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
