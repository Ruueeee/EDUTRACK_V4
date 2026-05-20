import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { gradeSubmissionSchema } from "@/lib/validators/assignment"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "INSTRUCTOR") return FORBIDDEN()

    const body = await req.json()
    const parsed = gradeSubmissionSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { assignment: { include: { course: true } } },
    })
    if (!submission) return NOT_FOUND()
    if (submission.assignment.course.instructorId !== session.user.id) return FORBIDDEN()

    if (parsed.data.grade > submission.assignment.maxPoints) {
      return fail(`Grade cannot exceed ${submission.assignment.maxPoints}`)
    }

    const updated = await prisma.submission.update({
      where: { id: params.id },
      data: {
        grade: parsed.data.grade,
        feedback: parsed.data.feedback,
        status: "GRADED",
        gradedAt: new Date(),
      },
    })
    await logActivity(session.user.id, ACTIONS.GRADE_SUBMISSION, {
      submissionId: updated.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
    })
    return ok(updated)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
