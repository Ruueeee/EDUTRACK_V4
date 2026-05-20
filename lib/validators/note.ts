import { z } from "zod"

export const createNoteSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(10000),
})

export const updateNoteSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  body: z.string().min(1).max(10000).optional(),
})
