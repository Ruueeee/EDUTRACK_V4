import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/layout/PageHeader"
import { ACTION_LABELS } from "@/lib/logger"
import { formatDateTime } from "@/lib/dates"
import { EmptyState } from "@/components/common/EmptyState"
import { Activity } from "lucide-react"
import { Pagination } from "@/components/common/Pagination"

const PAGE_SIZE = 20

export default async function StudentActivityPage({
  searchParams,
}: {
  searchParams: { page?: string }
}) {
  const session = await auth()
  const userId = session!.user.id
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))

  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.activityLog.count({ where: { userId } }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Log" description="A history of your actions." />
      {items.length === 0 ? (
        <EmptyState Icon={Activity} title="No activity yet" />
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{ACTION_LABELS[row.action] ?? row.action}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {row.metadata ? JSON.stringify(row.metadata) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination basePath="/student/activity" page={page} total={total} pageSize={PAGE_SIZE} />
    </div>
  )
}
