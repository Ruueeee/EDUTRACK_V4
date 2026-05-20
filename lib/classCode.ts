import { prisma } from "./prisma"

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 6

export async function generateUniqueClassCode(): Promise<string> {
  while (true) {
    const code = Array.from(
      { length: CODE_LENGTH },
      () => CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("")
    const found = await prisma.course.findUnique({ where: { classCode: code } })
    if (!found) return code
  }
}
