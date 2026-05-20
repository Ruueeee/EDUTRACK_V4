import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, FORBIDDEN, UNAUTHORIZED, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { logActivity, ACTIONS } from "@/lib/logger"

const schema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]).optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "ADMIN") return FORBIDDEN()
    if (params.id === session.user.id) return fail("Admins cannot modify themselves")

    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const existing = await prisma.user.findUnique({ where: { id: params.id } })
    if (!existing) return NOT_FOUND()

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: parsed.data,
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    })
    await logActivity(session.user.id, ACTIONS.ADMIN_UPDATE_USER, { targetId: params.id, ...parsed.data })
    return ok(updated)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
