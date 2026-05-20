import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/components/common/EmptyState"
import { AnnouncementForm } from "@/components/announcements/AnnouncementForm"
import { AssignmentForm } from "@/components/assignments/AssignmentForm"
import { ArchiveCourseButton } from "@/components/courses/ArchiveCourseButton"
import { Megaphone, ListChecks, Users, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { deadlineClass, formatDate, formatDueDate } from "@/lib/dates"

export default async function InstructorCoursePage({
  params,
}: {
  params: { courseId: string }
}) {
  const session = await auth()
  const course = await prisma.course.findFirst({
    where: { id: params.courseId, instructorId: session!.user.id },
    include: {
      enrollments: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              _count: { select: { submissions: { where: { assignment: { courseId: params.courseId } } } } },
            },
          },
        },
        orderBy: { joinedAt: "asc" },
      },
      announcements: { orderBy: { createdAt: "desc" } },
      assignments: {
        orderBy: { dueDate: "asc" },
        include: { _count: { select: { submissions: true } } },
      },
    },
  })
  if (!course) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={course.title}
        description={`Class code: ${course.classCode}`}
        action={<ArchiveCourseButton courseId={course.id} isArchived={course.isArchived} />}
      />
      {course.isArchived && (
        <div className="rounded-lg border bg-card p-3 text-xs text-muted-foreground">
          This course is archived — students cannot access it.
        </div>
      )}

      <Tabs defaultValue="announcements">
        <TabsList>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="roster">Roster</TabsTrigger>
        </TabsList>

        <TabsContent value="announcements">
          <div className="mb-3 flex justify-end">
            <AnnouncementForm courseId={course.id} />
          </div>
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
          <div className="mb-3 flex justify-end">
            <AssignmentForm courseId={course.id} />
          </div>
          {course.assignments.length === 0 ? (
            <EmptyState Icon={ListChecks} title="No assignments yet" />
          ) : (
            <div className="space-y-3">
              {course.assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/instructor/courses/${course.id}/assignments/${a.id}`}
                  className="block rounded-lg border bg-card p-4 shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="truncate text-sm font-medium">{a.title}</h3>
                    <Badge variant="outline">{a._count.submissions} submissions</Badge>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Clock className={`h-3.5 w-3.5 ${deadlineClass(a.dueDate)}`} />
                    <span className={`text-xs ${deadlineClass(a.dueDate)}`}>{formatDueDate(a.dueDate)}</span>
                    <span className="text-xs text-muted-foreground">· {a.maxPoints} pts</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="roster">
          {course.enrollments.length === 0 ? (
            <EmptyState Icon={Users} title="No students enrolled" description={`Share class code ${course.classCode} to invite students.`} />
          ) : (
            <div className="rounded-lg border bg-card shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
                    <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {course.enrollments.map((e) => (
                    <tr key={e.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="px-4 py-3 font-medium">{e.user.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.user.email}</td>
                      <td className="px-4 py-3 text-muted-foreground">{e.user._count.submissions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
