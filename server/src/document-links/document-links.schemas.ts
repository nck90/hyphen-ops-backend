import { z } from 'zod'

export const createDocumentLinkSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  url: z.url(),
  description: z.string().optional(),
  relatedEventId: z.string().min(1).optional(),
  relatedLogId: z.string().min(1).optional(),
  createdById: z.string().min(1).optional()
})

export const updateDocumentLinkSchema = z.object({
  projectId: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  url: z.url().optional(),
  description: z.string().nullable().optional(),
  relatedEventId: z.string().min(1).nullable().optional(),
  relatedLogId: z.string().min(1).nullable().optional(),
  createdById: z.string().min(1).nullable().optional()
})

export type CreateDocumentLinkInput = z.infer<typeof createDocumentLinkSchema>
export type UpdateDocumentLinkInput = z.infer<typeof updateDocumentLinkSchema>
