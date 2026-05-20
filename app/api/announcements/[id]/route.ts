import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { updateAnnouncementSchema } from "@/lib/validators/assignment"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
      include: { course: true },
    })
    if (!announcement) return NOT_FOUND()
    if (announcement.course.instructorId !== session.user.id) return FORBIDDEN()

    const body = await req.json()
    const parsed = updateAnnouncementSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const updated = await prisma.announcement.update({ where: { id: params.id }, data: parsed.data })
    await logActivity(session.user.id, ACTIONS.UPDATE_ANNOUNCEMENT, { announcementId: updated.id })
    return ok(updated)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const announcement = await prisma.announcement.findUnique({
      where: { id: params.id },
      include: { course: true },
    })
    if (!announcement) return NOT_FOUND()
    if (announcement.course.instructorId !== session.user.id) return FORBIDDEN()

    await prisma.announcement.delete({ where: { id: params.id } })
    await logActivity(session.user.id, ACTIONS.DELETE_ANNOUNCEMENT, { announcementId: params.id })
    return ok({ id: params.id })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
