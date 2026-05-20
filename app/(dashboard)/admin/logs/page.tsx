import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { LogFilters } from "@/components/admin/LogFilters"
import { ACTION_LABELS } from "@/lib/logger"
import { formatDateTime } from "@/lib/dates"
import { ScrollText } from "lucide-react"

const PAGE_SIZE = 50

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: { page?: string; userId?: string; action?: string; from?: string; to?: string }
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const where: Prisma.ActivityLogWhereInput = {}
  if (searchParams.userId) where.userId = searchParams.userId
  if (searchParams.action) where.action = searchParams.action
  if (searchParams.from || searchParams.to) {
    where.createdAt = {}
    if (searchParams.from) where.createdAt.gte = new Date(searchParams.from)
    if (searchParams.to) where.createdAt.lte = new Date(searchParams.to)
  }

  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    }),
    prisma.activityLog.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Activity Logs" description="System-wide audit trail." action={<LogFilters />} />
      {items.length === 0 ? (
        <EmptyState Icon={ScrollText} title="No logs match your filters" />
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">User</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Action</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Details</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.user.name}</div>
                    <div className="text-xs text-muted-foreground">{row.user.email}</div>
                  </td>
                  <td className="px-4 py-3">{ACTION_LABELS[row.action] ?? row.action}</td>
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
      <Pagination
        basePath="/admin/logs"
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        searchParams={{
          userId: searchParams.userId,
          action: searchParams.action,
          from: searchParams.from,
          to: searchParams.to,
        }}
      />
    </div>
  )
}
