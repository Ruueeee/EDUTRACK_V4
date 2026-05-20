import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import type { Prisma, Role } from "@prisma/client"
import { PageHeader } from "@/components/layout/PageHeader"
import { EmptyState } from "@/components/common/EmptyState"
import { Pagination } from "@/components/common/Pagination"
import { RoleFilter } from "@/components/admin/RoleFilter"
import { UserActions } from "@/components/admin/UserActions"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/dates"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 20

const ROLE_TEXT: Record<Role, string> = {
  ADMIN: "text-purple-700",
  INSTRUCTOR: "text-blue-700",
  STUDENT: "text-gray-700",
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; role?: string; q?: string }
}) {
  const session = await auth()
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10))
  const role = searchParams.role
  const q = searchParams.q

  const where: Prisma.UserWhereInput = {}
  if (role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) where.role = role as Role
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
    ]
  }

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    }),
    prisma.user.count({ where }),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage all accounts." action={<RoleFilter />} />
      {items.length === 0 ? (
        <EmptyState Icon={Users} title="No users found" />
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr className="text-left">
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Role</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs font-medium", ROLE_TEXT[u.role])}>{u.role}</span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? (
                      <Badge variant="graded">Active</Badge>
                    ) : (
                      <Badge variant="late">Inactive</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id === session!.user.id ? (
                      <span className="text-xs text-muted-foreground">You</span>
                    ) : (
                      <UserActions userId={u.id} isActive={u.isActive} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination
        basePath="/admin/users"
        page={page}
        total={total}
        pageSize={PAGE_SIZE}
        searchParams={{ role, q }}
      />
    </div>
  )
}
