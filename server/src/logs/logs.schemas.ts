import { z } from 'zod'

export const createLogSchema = z.object({
  projectId: z.string().min(1),
  eventId: z.string().min(1).optional(),
  type: z.string().min(1),
  content: z.string().min(1),
  authorId: z.string().min(1),
  nextAction: z.string().min(1).optional()
})

export const updateLogSchema = z.object({
  projectId: z.string().min(1).optional(),
  eventId: z.string().min(1).nullable().optional(),
  type: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  authorId: z.string().min(1).optional(),
  nextAction: z.string().min(1).nullable().optional()
})

export type CreateLogInput = z.infer<typeof createLogSchema>
export type UpdateLogInput = z.infer<typeof updateLogSchema>
