import { z } from "zod"

export const createCourseSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
})

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  isArchived: z.boolean().optional(),
})

export const enrollSchema = z.object({
  classCode: z.string().min(4).max(12),
})
