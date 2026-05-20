import { NextResponse } from "next/server"

export type ApiResponse<T> = { data: T | null; error: string | null }

export function ok<T>(data: T): NextResponse {
  return NextResponse.json({ data, error: null } satisfies ApiResponse<T>)
}

export function fail(message: string, status = 400): NextResponse {
  return NextResponse.json({ data: null, error: message } satisfies ApiResponse<null>, { status })
}

export const UNAUTHORIZED = () => fail("Unauthorized", 401)
export const FORBIDDEN = () => fail("Forbidden", 403)
export const NOT_FOUND = () => fail("Not found", 404)
export const SERVER_ERROR = () => fail("Internal server error", 500)
