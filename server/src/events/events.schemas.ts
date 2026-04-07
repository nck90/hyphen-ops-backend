import { z } from 'zod'

const isoDate = z.string().datetime()
const eventStatusSchema = z.enum(['PENDING', 'DONE', 'FAILED'])

export const createEventSchema = z.object({
  projectId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  startAt: isoDate,
  endAt: isoDate,
  ownerId: z.string().min(1),
  status: eventStatusSchema.optional(),
  participantIds: z.array(z.string().min(1)).default([])
})

export const updateEventSchema = z.object({
  projectId: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  startAt: isoDate.optional(),
  endAt: isoDate.optional(),
  ownerId: z.string().min(1).optional(),
  status: eventStatusSchema.optional(),
  participantIds: z.array(z.string().min(1)).optional()
})

export const importMarchPlanSchema = z
  .object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    projectName: z.string().min(1).optional(),
    ownerName: z.string().min(1).optional()
  })
  .default({})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
export type ImportMarchPlanInput = z.infer<typeof importMarchPlanSchema>
