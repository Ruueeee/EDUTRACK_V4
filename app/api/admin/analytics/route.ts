import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, FORBIDDEN, UNAUTHORIZED, SERVER_ERROR } from "@/lib/api"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "ADMIN") return FORBIDDEN()

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [totalUsers, totalCourses, totalSubmissions, byStatus, activeUsers] =
      await prisma.$transaction([
        prisma.user.count(),
        prisma.course.count(),
        prisma.submission.count(),
        prisma.submission.groupBy({
          by: ["status"],
          _count: { _all: true },
          orderBy: { status: "asc" },
        }),
        prisma.activityLog.findMany({
          where: { createdAt: { gte: sevenDaysAgo } },
          distinct: ["userId"],
          select: { userId: true },
        }),
      ])

    const submissionsByStatus: Record<"PENDING" | "SUBMITTED" | "GRADED" | "LATE", number> = {
      PENDING: 0,
      SUBMITTED: 0,
      GRADED: 0,
      LATE: 0,
    }
    for (const row of byStatus) {
      const count = typeof row._count === "object" && row._count ? row._count._all ?? 0 : 0
      submissionsByStatus[row.status as keyof typeof submissionsByStatus] = count
    }

    return ok({
      totalUsers,
      totalCourses,
      totalSubmissions,
      submissionsByStatus,
      activeUsersLast7Days: activeUsers.length,
    })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
