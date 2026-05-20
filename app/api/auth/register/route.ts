import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logActivity, ACTIONS } from "@/lib/logger"

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6).max(100),
  role: z.enum(["STUDENT", "INSTRUCTOR"]),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 })
    }
    const { name, email, password, role } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ data: null, error: "Email already registered" }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role },
      select: { id: true, name: true, email: true, role: true },
    })

    await logActivity(user.id, ACTIONS.REGISTER, { role })

    return NextResponse.json({ data: user, error: null })
  } catch (err) {
    console.error("[register] error", err)
    return NextResponse.json({ data: null, error: "Internal server error" }, { status: 500 })
  }
}
