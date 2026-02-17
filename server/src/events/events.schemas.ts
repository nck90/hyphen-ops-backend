import { z } from 'zod'

const isoDate = z.string().datetime()

export const createEventSchema = z.object({
  projectId: z.string().min(1),
  type: z.string().min(1),
  title: z.string().min(1),
  startAt: isoDate,
  endAt: isoDate,
  ownerId: z.string().min(1),
  participantIds: z.array(z.string().min(1)).default([])
})

export const updateEventSchema = z.object({
  projectId: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  startAt: isoDate.optional(),
  endAt: isoDate.optional(),
  ownerId: z.string().min(1).optional(),
  participantIds: z.array(z.string().min(1)).optional()
})

export type CreateEventInput = z.infer<typeof createEventSchema>
export type UpdateEventInput = z.infer<typeof updateEventSchema>
