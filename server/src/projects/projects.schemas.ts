import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  status: z.enum(['기획', '개발', '런칭', '운영']),
  summary: z.string().min(1)
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>

