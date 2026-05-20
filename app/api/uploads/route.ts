import { NextRequest } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"
import { auth } from "@/lib/auth"
import { ok, fail, UNAUTHORIZED, SERVER_ERROR } from "@/lib/api"

const MAX_BYTES = 10 * 1024 * 1024
const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
])

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return UNAUTHORIZED()

    const form = await req.formData()
    const file = form.get("file") as File | null
    const assignmentId = form.get("assignmentId") as string | null
    if (!file) return fail("No file uploaded")
    if (file.size > MAX_BYTES) return fail("File exceeds 10MB")
    if (!ALLOWED.has(file.type)) return fail("Unsupported file type")

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const dir = path.join(process.cwd(), "public", "uploads", session.user.id, assignmentId ?? "general")
    await mkdir(dir, { recursive: true })
    const fileName = `${Date.now()}-${safeName}`
    const filePath = path.join(dir, fileName)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${session.user.id}/${assignmentId ?? "general"}/${fileName}`
    return ok({ fileUrl, fileName: file.name })
  } catch (err) {
    console.error(err)
    return SERVER_ERROR()
  }
}
