import { z } from 'zod'

export const ledgerEntryTypeSchema = z.enum(['INCOME', 'EXPENSE'])

export const createLedgerEntrySchema = z.object({
  occurredAt: z.string().datetime().optional(),
  type: ledgerEntryTypeSchema,
  category: z.string().min(1),
  detail: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().optional(),
  projectId: z.string().min(1).optional(),
  externalId: z.string().min(1).optional()
})

export const updateLedgerEntrySchema = createLedgerEntrySchema.partial()

export const updateLedgerSettingsSchema = z.object({
  startingBalance: z.number().int()
})

export type CreateLedgerEntryInput = z.infer<typeof createLedgerEntrySchema>
export type UpdateLedgerEntryInput = z.infer<typeof updateLedgerEntrySchema>
export type UpdateLedgerSettingsInput = z.infer<typeof updateLedgerSettingsSchema>
