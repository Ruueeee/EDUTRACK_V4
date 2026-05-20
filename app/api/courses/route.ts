import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, SERVER_ERROR } from "@/lib/api"
import { createCourseSchema } from "@/lib/validators/course"
import { generateUniqueClassCode } from "@/lib/classCode"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    const userId = session.user.id
    const role = session.user.role

    if (role === "INSTRUCTOR") {
      const courses = await prisma.course.findMany({
        where: { instructorId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { enrollments: true, assignments: true } },
        },
      })
      return ok(courses)
    }

    if (role === "STUDENT") {
      const courses = await prisma.course.findMany({
        where: { enrollments: { some: { userId } }, isArchived: false },
        orderBy: { createdAt: "desc" },
        include: {
          instructor: { select: { id: true, name: true } },
          _count: { select: { assignments: true } },
        },
      })
      return ok(courses)
    }

    // ADMIN
    const courses = await prisma.course.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true, assignments: true } },
      },
    })
    return ok(courses)
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
    const parsed = createCourseSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const classCode = await generateUniqueClassCode()
    const course = await prisma.course.create({
      data: { ...parsed.data, classCode, instructorId: session.user.id },
    })
    await logActivity(session.user.id, ACTIONS.CREATE_COURSE, { courseId: course.id })
    return ok(course)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
