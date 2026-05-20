import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { EmptyState } from "@/components/common/EmptyState"
import { Inbox } from "lucide-react"
import { formatDateTime } from "@/lib/dates"

export default async function InstructorHomePage() {
  const session = await auth()
  const instructorId = session!.user.id

  const [totalCourses, students, pendingGrading, recentToGrade] = await Promise.all([
    prisma.course.count({ where: { instructorId } }),
    prisma.enrollment.findMany({
      where: { course: { instructorId } },
      distinct: ["userId"],
      select: { userId: true },
    }),
    prisma.submission.count({
      where: { status: "SUBMITTED", assignment: { course: { instructorId } } },
    }),
    prisma.submission.findMany({
      where: { status: "SUBMITTED", assignment: { course: { instructorId } } },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: {
        student: { select: { name: true } },
        assignment: {
          select: { id: true, title: true, course: { select: { id: true, title: true } } },
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description={`Welcome back, ${session!.user.name ?? "instructor"}.`} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Courses" value={totalCourses} />
        <StatCard label="Total Students" value={students.length} />
        <StatCard label="Pending Grading" value={pendingGrading} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Recent submissions to grade</h2>
        {recentToGrade.length === 0 ? (
          <EmptyState Icon={Inbox} title="Nothing to grade right now" />
        ) : (
          <div className="space-y-3">
            {recentToGrade.map((s) => (
              <Link
                key={s.id}
                href={`/instructor/courses/${s.assignment.course.id}/assignments/${s.assignment.id}`}
                className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium">{s.assignment.title}</h3>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {s.student.name} · {s.assignment.course.title}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {s.submittedAt ? formatDateTime(s.submittedAt) : "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
