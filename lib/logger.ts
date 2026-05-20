import { prisma } from "./prisma"
import type { Prisma } from "@prisma/client"

export async function logActivity(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    })
  } catch (err) {
    console.error("[logActivity] failed:", err)
  }
}

export const ACTIONS = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER",
  ENROLL_COURSE: "ENROLL_COURSE",
  VIEW_COURSE: "VIEW_COURSE",
  VIEW_ASSIGNMENT: "VIEW_ASSIGNMENT",
  SUBMIT_ASSIGNMENT: "SUBMIT_ASSIGNMENT",
  CREATE_COURSE: "CREATE_COURSE",
  UPDATE_COURSE: "UPDATE_COURSE",
  CREATE_ASSIGNMENT: "CREATE_ASSIGNMENT",
  UPDATE_ASSIGNMENT: "UPDATE_ASSIGNMENT",
  DELETE_ASSIGNMENT: "DELETE_ASSIGNMENT",
  POST_ANNOUNCEMENT: "POST_ANNOUNCEMENT",
  UPDATE_ANNOUNCEMENT: "UPDATE_ANNOUNCEMENT",
  DELETE_ANNOUNCEMENT: "DELETE_ANNOUNCEMENT",
  GRADE_SUBMISSION: "GRADE_SUBMISSION",
  CREATE_NOTE: "CREATE_NOTE",
  UPDATE_NOTE: "UPDATE_NOTE",
  DELETE_NOTE: "DELETE_NOTE",
  ADMIN_UPDATE_USER: "ADMIN_UPDATE_USER",
} as const

export const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Logged in",
  REGISTER: "Registered",
  ENROLL_COURSE: "Enrolled in course",
  VIEW_COURSE: "Viewed course",
  VIEW_ASSIGNMENT: "Viewed assignment",
  SUBMIT_ASSIGNMENT: "Submitted assignment",
  CREATE_COURSE: "Created course",
  UPDATE_COURSE: "Updated course",
  CREATE_ASSIGNMENT: "Created assignment",
  UPDATE_ASSIGNMENT: "Updated assignment",
  DELETE_ASSIGNMENT: "Deleted assignment",
  POST_ANNOUNCEMENT: "Posted announcement",
  UPDATE_ANNOUNCEMENT: "Updated announcement",
  DELETE_ANNOUNCEMENT: "Deleted announcement",
  GRADE_SUBMISSION: "Graded submission",
  CREATE_NOTE: "Created note",
  UPDATE_NOTE: "Updated note",
  DELETE_NOTE: "Deleted note",
  ADMIN_UPDATE_USER: "Admin updated user",
}
