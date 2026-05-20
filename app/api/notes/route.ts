import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, SERVER_ERROR } from "@/lib/api"
import { createNoteSchema } from "@/lib/validators/note"
import { logActivity, ACTIONS } from "@/lib/logger"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "STUDENT") return FORBIDDEN()

    const notes = await prisma.selfNote.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
    })
    return ok(notes)
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
    const parsed = createNoteSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const note = await prisma.selfNote.create({
      data: { ...parsed.data, userId: session.user.id },
    })
    await logActivity(session.user.id, ACTIONS.CREATE_NOTE, { noteId: note.id })
    return ok(note)
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
