import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ok, fail, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, SERVER_ERROR } from "@/lib/api"
import { updateNoteSchema } from "@/lib/validators/note"
import { logActivity, ACTIONS } from "@/lib/logger"

async function ownNote(id: string, userId: string) {
  const note = await prisma.selfNote.findUnique({ where: { id } })
  if (!note) return null
  if (note.userId !== userId) return "forbidden" as const
  return note
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()
    if (session.user.role !== "STUDENT") return FORBIDDEN()

    const result = await ownNote(params.id, session.user.id)
    if (!result) return NOT_FOUND()
    if (result === "forbidden") return FORBIDDEN()

    const body = await req.json()
    const parsed = updateNoteSchema.safeParse(body)
    if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input")

    const updated = await prisma.selfNote.update({ where: { id: params.id }, data: parsed.data })
    await logActivity(session.user.id, ACTIONS.UPDATE_NOTE, { noteId: updated.id })
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
    if (session.user.role !== "STUDENT") return FORBIDDEN()

    const result = await ownNote(params.id, session.user.id)
    if (!result) return NOT_FOUND()
    if (result === "forbidden") return FORBIDDEN()

    await prisma.selfNote.delete({ where: { id: params.id } })
    await logActivity(session.user.id, ACTIONS.DELETE_NOTE, { noteId: params.id })
    return ok({ id: params.id })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
