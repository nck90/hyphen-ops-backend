import { z } from 'zod'

export const createMemberSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/)
})

export type CreateMemberInput = z.infer<typeof createMemberSchema>

