import { BadRequestException } from '@nestjs/common'
import { z, type ZodSchema } from 'zod'

export const validateZod = <T>(schema: ZodSchema<T>, payload: unknown): T => {
  const parsed = schema.safeParse(payload)
  if (parsed.success) {
    return parsed.data
  }

  throw new BadRequestException({
    message: 'Validation failed',
    issues: z.treeifyError(parsed.error)
  })
}
