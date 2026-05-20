import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { CourseCard } from "@/components/courses/CourseCard"
import { EnrollDialog } from "@/components/courses/EnrollDialog"
import { EmptyState } from "@/components/common/EmptyState"
import { GraduationCap } from "lucide-react"

export default async function StudentCoursesPage() {
  const session = await auth()
  const userId = session!.user.id

  const courses = await prisma.course.findMany({
    where: { enrollments: { some: { userId } }, isArchived: false },
    orderBy: { createdAt: "desc" },
    include: {
      instructor: { select: { id: true, name: true } },
      _count: { select: { assignments: true } },
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Courses"
        description="Enrolled classes — open one to view announcements and assignments."
        action={<EnrollDialog />}
      />
      {courses.length === 0 ? (
        <EmptyState
          Icon={GraduationCap}
          title="No courses yet"
          description="Use a class code from your instructor to enroll."
          action={<EnrollDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <CourseCard
              key={c.id}
              href={`/student/courses/${c.id}`}
              title={c.title}
              description={c.description}
              instructorName={c.instructor.name}
              stats={[{ label: "assignments", value: c._count.assignments }]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
