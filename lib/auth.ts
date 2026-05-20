import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { logActivity, ACTIONS } from "@/lib/logger"

export type AppRole = "STUDENT" | "INSTRUCTOR" | "ADMIN"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: AppRole
    } & DefaultSession["user"]
  }
  interface User {
    role: AppRole
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "").toLowerCase().trim()
        const password = String(credentials?.password ?? "")
        if (!email || !password) return null

        const user = await prisma.user.findUnique({ where: { email } })
        if (!user || !user.isActive) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        await logActivity(user.id, ACTIONS.LOGIN)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role as AppRole,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id
        token.role = (user as { role: AppRole }).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as AppRole
      }
      return session
    },
  },
})
