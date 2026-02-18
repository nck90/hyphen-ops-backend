import { z } from 'zod'

export const companyDirectoryUpdateSchema = z.object({
  businessEmail: z.string().email().optional().nullable(),
  bankName: z.string().min(1).optional().nullable(),
  accountHolder: z.string().min(1).optional().nullable(),
  accountNumber: z.string().min(1).optional().nullable(),
  note: z.string().optional().nullable()
})

export const memberDirectoryUpdateSchema = z.object({
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional().nullable(),
  address: z.string().optional().nullable(),
  bankName: z.string().min(1).optional().nullable(),
  accountHolder: z.string().min(1).optional().nullable(),
  accountNumber: z.string().min(1).optional().nullable(),
  note: z.string().optional().nullable()
})

export type CompanyDirectoryUpdateInput = z.infer<typeof companyDirectoryUpdateSchema>
export type MemberDirectoryUpdateInput = z.infer<typeof memberDirectoryUpdateSchema>
