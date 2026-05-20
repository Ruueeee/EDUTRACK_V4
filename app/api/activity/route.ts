import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, UNAUTHORIZED, SERVER_ERROR } from "@/lib/api"
import type { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)))
    const skip = (page - 1) * limit

    const where: Prisma.ActivityLogWhereInput = {}
    if (session.user.role !== "ADMIN") {
      where.userId = session.user.id
    } else {
      const userId = sp.get("userId")
      const action = sp.get("action")
      const from = sp.get("from")
      const to = sp.get("to")
      if (userId) where.userId = userId
      if (action) where.action = action
      if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to) where.createdAt.lte = new Date(to)
      }
    }

    const [items, total] = await prisma.$transaction([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.activityLog.count({ where }),
    ])

    return ok({ items, total, page, limit })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
