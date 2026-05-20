import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { StatusBadge } from "@/components/common/StatusBadge"
import { GradeDialog } from "@/components/instructor/GradeDialog"
import { Inbox, Clock, FileText } from "lucide-react"
import { formatDate, formatDateTime, formatDueDate } from "@/lib/dates"

export default async function InstructorAssignmentPage({
  params,
}: {
  params: { courseId: string; assignmentId: string }
}) {
  const session = await auth()
  const assignment = await prisma.assignment.findFirst({
    where: {
      id: params.assignmentId,
      courseId: params.courseId,
      course: { instructorId: session!.user.id },
    },
    include: {
      course: { select: { id: true, title: true, classCode: true } },
      submissions: {
        include: { student: { select: { id: true, name: true, email: true } } },
        orderBy: { submittedAt: "desc" },
      },
    },
  })
  if (!assignment) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.course.title} · ${assignment.maxPoints} pts · ${formatDueDate(assignment.dueDate)}`}
      />
      {assignment.description && (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground shadow-sm">
          {assignment.description}
        </p>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Submissions ({assignment.submissions.length})</h2>
        {assignment.submissions.length === 0 ? (
          <EmptyState Icon={Inbox} title="No submissions yet" />
        ) : (
          <div className="rounded-lg border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Student</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Submitted</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Grade</th>
                  <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">File</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {assignment.submissions.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="font-medium">{s.student.name}</div>
                      <div className="text-xs text-muted-foreground">{s.student.email}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.submittedAt ? formatDateTime(s.submittedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.status} />
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {s.grade != null ? `${s.grade}/${assignment.maxPoints}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {s.fileUrl ? (
                        <Link
                          href={s.fileUrl}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {s.fileName ?? "Download"}
                        </Link>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <GradeDialog
                        submissionId={s.id}
                        studentName={s.student.name}
                        maxPoints={assignment.maxPoints}
                        currentGrade={s.grade}
                        currentFeedback={s.feedback}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
