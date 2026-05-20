import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common/EmptyState"
import { AssignmentRow } from "@/components/assignments/AssignmentRow"
import { Megaphone, ListChecks } from "lucide-react"
import { formatDate } from "@/lib/dates"

export default async function StudentCoursePage({
  params,
}: {
  params: { courseId: string }
}) {
  const session = await auth()
  const userId = session!.user.id

  const course = await prisma.course.findFirst({
    where: { id: params.courseId, enrollments: { some: { userId } } },
    include: {
      instructor: { select: { name: true } },
      announcements: { orderBy: { createdAt: "desc" } },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: { submissions: { where: { studentId: userId } } },
      },
    },
  })
  if (!course) {
    if (await prisma.course.findUnique({ where: { id: params.courseId } })) redirect("/student/courses")
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader title={course.title} description={`Instructor: ${course.instructor.name}`} />
      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
        </TabsList>
        <TabsContent value="announcements">
          {course.announcements.length === 0 ? (
            <EmptyState Icon={Megaphone} title="No announcements yet" />
          ) : (
            <div className="space-y-3">
              {course.announcements.map((a) => (
                <div key={a.id} className="rounded-lg border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-medium">{a.title}</h3>
                    <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.createdAt)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="assignments">
          {course.assignments.length === 0 ? (
            <EmptyState Icon={ListChecks} title="No assignments yet" />
          ) : (
            <div className="space-y-3">
              {course.assignments.map((a) => (
                <AssignmentRow
                  key={a.id}
                  id={a.id}
                  title={a.title}
                  description={a.description}
                  dueDate={a.dueDate}
                  maxPoints={a.maxPoints}
                  submission={a.submissions[0] ?? null}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
