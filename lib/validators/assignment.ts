import { z } from "zod"

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime(),
  maxPoints: z.number().int().min(1).max(1000).default(100),
})

export const updateAssignmentSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  maxPoints: z.number().int().min(1).max(1000).optional(),
})

export const createAnnouncementSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(3).max(150),
  body: z.string().min(1).max(5000),
})

export const updateAnnouncementSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  body: z.string().min(1).max(5000).optional(),
})

export const createSubmissionSchema = z.object({
  assignmentId: z.string().min(1),
  fileUrl: z.string().min(1),
  fileName: z.string().min(1).max(200),
})

export const gradeSubmissionSchema = z.object({
  grade: z.number().int().min(0),
  feedback: z.string().max(2000).optional(),
})
