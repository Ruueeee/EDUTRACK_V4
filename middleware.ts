import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export default auth((req) => {
  const { nextUrl } = req
  const isAuth = !!req.auth
  const role = req.auth?.user?.role

  const path = nextUrl.pathname
  const isAuthPage = path === "/login" || path === "/register"
  const isStudent = path.startsWith("/student")
  const isInstructor = path.startsWith("/instructor")
  const isAdmin = path.startsWith("/admin")
  const isProtected = isStudent || isInstructor || isAdmin

  if (isAuthPage && isAuth) {
    const target =
      role === "INSTRUCTOR" ? "/instructor" : role === "ADMIN" ? "/admin" : "/student"
    return NextResponse.redirect(new URL(target, nextUrl))
  }

  if (isProtected && !isAuth) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isAuth) {
    if (isStudent && role !== "STUDENT") return NextResponse.redirect(new URL("/", nextUrl))
    if (isInstructor && role !== "INSTRUCTOR") return NextResponse.redirect(new URL("/", nextUrl))
    if (isAdmin && role !== "ADMIN") return NextResponse.redirect(new URL("/", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
}
