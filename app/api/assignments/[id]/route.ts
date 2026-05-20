import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { updateAssignmentSchema } from "@/lib/validators/assignment"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            instructorId: true,
            enrollments: { where: { userId: session.user.id }, select: { id: true } },
          },
        },
      },
    })
    if (!assignment) return NOT_FOUND()
    const role = session.user.role
    const allowed =
      role === "ADMIN" ||
      (role === "INSTRUCTOR" && assignment.course.instructorId === session.user.id) ||
      assignment.course.enrollments.length > 0
    if (!allowed) return FORBIDDEN()

    let mySubmission = null
    if (role === "STUDENT") {
      mySubmission = await prisma.submission.findUnique({
        where: { studentId_assignmentId: { studentId: session.user.id, assignmentId: assignment.id } },
      })
    }

    await logActivity(session.user.id, ACTIONS.VIEW_ASSIGNMENT, { assignmentId: assignment.id })
    return ok({ ...assignment, mySubmission })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true },
    })
    if (!assignment) return NOT_FOUND()
    if (assignment.course.instructorId !== session.user.id) return FORBIDDEN()

    const body = await req.json()
    const parsed = updateAssignmentSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const data: Record<string, unknown> = { ...parsed.data }
    if (parsed.data.dueDate) data.dueDate = new Date(parsed.data.dueDate)

    const updated = await prisma.assignment.update({ where: { id: params.id }, data })
    await logActivity(session.user.id, ACTIONS.UPDATE_ASSIGNMENT, { assignmentId: updated.id })
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

    const assignment = await prisma.assignment.findUnique({
      where: { id: params.id },
      include: { course: true },
    })
    if (!assignment) return NOT_FOUND()
    if (assignment.course.instructorId !== session.user.id) return FORBIDDEN()

    await prisma.$transaction([
      prisma.submission.deleteMany({ where: { assignmentId: params.id } }),
      prisma.assignment.delete({ where: { id: params.id } }),
    ])
    await logActivity(session.user.id, ACTIONS.DELETE_ASSIGNMENT, { assignmentId: params.id })
    return ok({ id: params.id })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
