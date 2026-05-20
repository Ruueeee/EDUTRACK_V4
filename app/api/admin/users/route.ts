import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, FORBIDDEN, UNAUTHORIZED, SERVER_ERROR } from "@/lib/api"
import type { Prisma, Role } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "ADMIN") return FORBIDDEN()

    const sp = req.nextUrl.searchParams
    const page = Math.max(1, parseInt(sp.get("page") ?? "1", 10))
    const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") ?? "20", 10)))
    const role = sp.get("role") as Role | null
    const q = sp.get("q")
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}
    if (role && ["STUDENT", "INSTRUCTOR", "ADMIN"].includes(role)) where.role = role
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
        skip,
        take: limit,
        select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      }),
      prisma.user.count({ where }),
    ])

    return ok({ items, total, page, limit })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
