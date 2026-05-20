import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { createAnnouncementSchema } from "@/lib/validators/assignment"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    const courseId = req.nextUrl.searchParams.get("courseId")
    if (!courseId) return fail("courseId required")

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { enrollments: { where: { userId: session.user.id } } },
    })
    if (!course) return NOT_FOUND()
    const role = session.user.role
    const allowed =
      role === "ADMIN" ||
      (role === "INSTRUCTOR" && course.instructorId === session.user.id) ||
      course.enrollments.length > 0
    if (!allowed) return FORBIDDEN()

    const announcements = await prisma.announcement.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
    })
    return ok(announcements)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const body = await req.json()
    const parsed = createAnnouncementSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const course = await prisma.course.findUnique({ where: { id: parsed.data.courseId } })
    if (!course) return NOT_FOUND()
    if (course.instructorId !== session.user.id) return FORBIDDEN()

    const announcement = await prisma.announcement.create({ data: parsed.data })
    await logActivity(session.user.id, ACTIONS.POST_ANNOUNCEMENT, {
      courseId: course.id,
      announcementId: announcement.id,
    })
    return ok(announcement)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
