import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { CourseCreateDialog } from "@/components/courses/CourseCreateDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { GraduationCap } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default async function InstructorCoursesPage({
  searchParams,
}: {
  searchParams: { archived?: string }
}) {
  const session = await auth()
  const showArchived = searchParams.archived === "1"

  const courses = await prisma.course.findMany({
    where: {
      instructorId: session!.user.id,
      ...(showArchived ? {} : { isArchived: false }),
    },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { enrollments: true, assignments: true } } },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        description="Courses you teach. Use the class code to enroll students."
        action={
          <div className="flex items-center gap-2">
            <Link
              href={showArchived ? "/instructor/courses" : "/instructor/courses?archived=1"}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {showArchived ? "Hide archived" : "Show archived"}
            </Link>
            <CourseCreateDialog />
          </div>
        }
      />
      {courses.length === 0 ? (
        <EmptyState
          Icon={GraduationCap}
          title="No courses yet"
          description="Create your first course to get started."
          action={<CourseCreateDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Link
              key={c.id}
              href={`/instructor/courses/${c.id}`}
              className="block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="truncate text-sm font-medium">{c.title}</h3>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{c.classCode}</span>
              </div>
              {c.description && (
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c._count.enrollments}</span> students
                </span>
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{c._count.assignments}</span> assignments
                </span>
                {c.isArchived && <Badge variant="archived">Archived</Badge>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
