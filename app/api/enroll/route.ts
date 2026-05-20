import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { enrollSchema } from "@/lib/validators/course"
import { logActivity, ACTIONS } from "@/lib/logger"

// Convenience: enroll by class code without courseId in path.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "STUDENT") return FORBIDDEN()

    const body = await req.json().catch(() => ({}))
    const parsed = enrollSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid class code")

    const code = parsed.data.classCode.toUpperCase()
    const course = await prisma.course.findUnique({ where: { classCode: code } })
    if (!course || course.isArchived) return NOT_FOUND()

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: course.id } },
    })
    if (existing) return fail("Already enrolled")

    const enrollment = await prisma.enrollment.create({
      data: { userId: session.user.id, courseId: course.id },
    })
    await logActivity(session.user.id, ACTIONS.ENROLL_COURSE, { courseId: course.id })
    return ok({ enrollment, course })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
