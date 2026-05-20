import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { createSubmissionSchema } from "@/lib/validators/assignment"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    const assignmentId = req.nextUrl.searchParams.get("assignmentId")
    if (!assignmentId) return fail("assignmentId required")

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })
    if (!assignment) return NOT_FOUND()

    const role = session.user.role
    const userId = session.user.id

    if (role === "STUDENT") {
      const subs = await prisma.submission.findMany({
        where: { assignmentId, studentId: userId },
      })
      return ok(subs)
    }

    if (role === "INSTRUCTOR" && assignment.course.instructorId !== userId) return FORBIDDEN()

    const subs = await prisma.submission.findMany({
      where: { assignmentId },
      include: { student: { select: { id: true, name: true, email: true } } },
      orderBy: { submittedAt: "desc" },
    })
    return ok(subs)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "STUDENT") return FORBIDDEN()

    const body = await req.json()
    const parsed = createSubmissionSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const assignment = await prisma.assignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: {
        course: { include: { enrollments: { where: { userId: session.user.id } } } },
      },
    })
    if (!assignment) return NOT_FOUND()
    if (assignment.course.enrollments.length === 0) return FORBIDDEN()

    const now = new Date()
    const status = now > assignment.dueDate ? "LATE" : "SUBMITTED"

    const submission = await prisma.$transaction(async (tx) => {
      const s = await tx.submission.upsert({
        where: {
          studentId_assignmentId: {
            studentId: session.user.id,
            assignmentId: assignment.id,
          },
        },
        create: {
          studentId: session.user.id,
          assignmentId: assignment.id,
          fileUrl: parsed.data.fileUrl,
          fileName: parsed.data.fileName,
          status,
          submittedAt: now,
        },
        update: {
          fileUrl: parsed.data.fileUrl,
          fileName: parsed.data.fileName,
          status,
          submittedAt: now,
        },
      })
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: ACTIONS.SUBMIT_ASSIGNMENT,
          metadata: { assignmentId: assignment.id, submissionId: s.id, status },
        },
      })
      return s
    })

    return ok(submission)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
