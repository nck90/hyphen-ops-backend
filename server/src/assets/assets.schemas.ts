import { z } from 'zod'

export const createAssetSchema = z.object({
  projectId: z.string().min(1),
  url: z.string().min(1),
  tag: z.string().min(1),
  type: z.enum(['문서', '링크', '디자인', '저장소']),
  title: z.string().min(1)
})

export const updateAssetSchema = z.object({
  projectId: z.string().min(1).optional(),
  url: z.string().min(1).optional(),
  tag: z.string().min(1).optional(),
  type: z.enum(['문서', '링크', '디자인', '저장소']).optional(),
  title: z.string().min(1).optional()
})

export type CreateAssetInput = z.infer<typeof createAssetSchema>
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>
