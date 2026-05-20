import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/common/StatusBadge"
import { EmptyState } from "@/components/common/EmptyState"
import { ListChecks, Clock } from "lucide-react"
import { deadlineClass, formatDueDate } from "@/lib/dates"

type FilterKey = "all" | "pending" | "submitted" | "graded" | "late"

function deriveStatus(a: { dueDate: Date; submissions: { status: string }[] }) {
  const sub = a.submissions[0]
  if (sub) return sub.status
  return new Date() > a.dueDate ? "LATE" : "PENDING"
}

export default async function StudentTasksPage() {
  const session = await auth()
  const userId = session!.user.id

  const assignments = await prisma.assignment.findMany({
    where: { course: { enrollments: { some: { userId } }, isArchived: false } },
    orderBy: { dueDate: "asc" },
    include: {
      course: { select: { id: true, title: true } },
      submissions: { where: { studentId: userId } },
    },
  })

  const enriched = assignments.map((a) => ({ ...a, status: deriveStatus(a) }))
  const overdue = enriched.filter((a) => a.status === "PENDING" && a.dueDate < new Date())

  const groups: Record<FilterKey, typeof enriched> = {
    all: enriched,
    pending: enriched.filter((a) => a.status === "PENDING"),
    submitted: enriched.filter((a) => a.status === "SUBMITTED"),
    graded: enriched.filter((a) => a.status === "GRADED"),
    late: enriched.filter((a) => a.status === "LATE"),
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Task Tracker" description="All assignments across your enrolled courses." />

      {overdue.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-red-700">
            Overdue ({overdue.length})
          </h2>
          <div className="space-y-2">
            {overdue.map((a) => (
              <TaskItem key={a.id} a={a} />
            ))}
          </div>
        </section>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All ({groups.all.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({groups.pending.length})</TabsTrigger>
          <TabsTrigger value="submitted">Submitted ({groups.submitted.length})</TabsTrigger>
          <TabsTrigger value="graded">Graded ({groups.graded.length})</TabsTrigger>
          <TabsTrigger value="late">Late ({groups.late.length})</TabsTrigger>
        </TabsList>
        {(Object.keys(groups) as FilterKey[]).map((key) => (
          <TabsContent key={key} value={key}>
            {groups[key].length === 0 ? (
              <EmptyState Icon={ListChecks} title={`No ${key} tasks`} />
            ) : (
              <div className="space-y-2">
                {groups[key].map((a) => (
                  <TaskItem key={a.id} a={a} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function TaskItem({
  a,
}: {
  a: {
    id: string
    title: string
    dueDate: Date
    status: string
    course: { id: string; title: string }
  }
}) {
  return (
    <Link
      href={`/student/courses/${a.course.id}`}
      className="block rounded-lg border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{a.title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{a.course.title}</p>
        </div>
        <StatusBadge status={a.status} />
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Clock className={`h-3.5 w-3.5 ${deadlineClass(a.dueDate, a.status)}`} />
        <span className={`text-xs ${deadlineClass(a.dueDate, a.status)}`}>{formatDueDate(a.dueDate)}</span>
      </div>
    </Link>
  )
}
