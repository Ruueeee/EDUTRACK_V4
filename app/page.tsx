import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function Home() {
  const session = await auth()
  if (session?.user) {
    const role = session.user.role
    if (role === "STUDENT") redirect("/student")
    if (role === "INSTRUCTOR") redirect("/instructor")
    if (role === "ADMIN") redirect("/admin")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="text-center">
        <h1 className="text-3xl font-semibold tracking-tight">EduTrack</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Classroom and task management for Caraga State University
        </p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Create account
        </Link>
      </div>
    </main>
  )
}
