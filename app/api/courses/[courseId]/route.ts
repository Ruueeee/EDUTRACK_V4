import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { updateCourseSchema } from "@/lib/validators/course"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET(_req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()

    const course = await prisma.course.findUnique({
      where: { id: params.courseId },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        enrollments: { include: { user: { select: { id: true, name: true, email: true } } } },
        announcements: { orderBy: { createdAt: "desc" } },
        assignments: {
          orderBy: { dueDate: "asc" },
          include: { _count: { select: { submissions: true } } },
        },
      },
    })
    if (!course) return NOT_FOUND()

    const role = session.user.role
    const userId = session.user.id
    const isInstructor = role === "INSTRUCTOR" && course.instructorId === userId
    const isEnrolled = course.enrollments.some((e) => e.userId === userId)
    if (role !== "ADMIN" && !isInstructor && !isEnrolled) return FORBIDDEN()

    await logActivity(userId, ACTIONS.VIEW_COURSE, { courseId: course.id })
    return ok(course)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const course = await prisma.course.findUnique({ where: { id: params.courseId } })
    if (!course) return NOT_FOUND()
    if (course.instructorId !== session.user.id) return FORBIDDEN()

    const body = await req.json()
    const parsed = updateCourseSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const updated = await prisma.course.update({
      where: { id: params.courseId },
      data: parsed.data,
    })
    await logActivity(session.user.id, ACTIONS.UPDATE_COURSE, { courseId: updated.id })
    return ok(updated)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
