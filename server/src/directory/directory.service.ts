import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { decryptField, encryptField, toPrismaJson } from '../common/crypto-field'
import type { CompanyDirectoryUpdateInput, MemberDirectoryUpdateInput } from './directory.schemas'

const COMPANY_ID = 'default'

const normalize = (value: any) => (typeof value === 'string' ? value : value == null ? null : String(value))

@Injectable()
export class DirectoryService {
  constructor(private readonly prisma: PrismaService) {}

  private serializeCompany(row: any) {
    return {
      id: row.id,
      businessEmail: decryptField(row.businessEmail),
      bankName: decryptField(row.bankName),
      accountHolder: decryptField(row.accountHolder),
      accountNumber: decryptField(row.accountNumber),
      note: decryptField(row.note),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  private serializeMember(row: any) {
    return {
      id: row.id,
      memberId: row.memberId,
      email: decryptField(row.email),
      phone: decryptField(row.phone),
      address: decryptField(row.address),
      bankName: decryptField(row.bankName),
      accountHolder: decryptField(row.accountHolder),
      accountNumber: decryptField(row.accountNumber),
      note: decryptField(row.note),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString()
    }
  }

  async getSnapshot() {
    const [company, members] = await this.prisma.$transaction([
      this.prisma.companyDirectory.findUnique({ where: { id: COMPANY_ID } }),
      this.prisma.memberDirectory.findMany({ orderBy: { createdAt: 'asc' } })
    ])

    return {
      company: company ? this.serializeCompany(company) : null,
      members: members.map((row) => this.serializeMember(row))
    }
  }

  async updateCompany(input: CompanyDirectoryUpdateInput) {
    const updated = await this.prisma.companyDirectory.upsert({
      where: { id: COMPANY_ID },
      create: {
        id: COMPANY_ID,
        businessEmail: toPrismaJson(encryptField(normalize(input.businessEmail))),
        bankName: toPrismaJson(encryptField(normalize(input.bankName))),
        accountHolder: toPrismaJson(encryptField(normalize(input.accountHolder))),
        accountNumber: toPrismaJson(encryptField(normalize(input.accountNumber))),
        note: toPrismaJson(encryptField(normalize(input.note)))
      },
      update: {
        ...(Object.prototype.hasOwnProperty.call(input, 'businessEmail')
          ? { businessEmail: toPrismaJson(encryptField(normalize(input.businessEmail))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'bankName')
          ? { bankName: toPrismaJson(encryptField(normalize(input.bankName))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'accountHolder')
          ? { accountHolder: toPrismaJson(encryptField(normalize(input.accountHolder))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'accountNumber')
          ? { accountNumber: toPrismaJson(encryptField(normalize(input.accountNumber))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'note')
          ? { note: toPrismaJson(encryptField(normalize(input.note))) }
          : {})
      }
    })

    return this.serializeCompany(updated)
  }

  async ensureMember(memberId: string) {
    const existing = await this.prisma.memberDirectory.findUnique({ where: { memberId } })
    if (existing) {
      return existing
    }

    return this.prisma.memberDirectory.create({
      data: {
        memberId
      }
    })
  }

  async updateMember(memberId: string, input: MemberDirectoryUpdateInput) {
    await this.ensureMember(memberId)

    const updated = await this.prisma.memberDirectory.update({
      where: { memberId },
      data: {
        ...(Object.prototype.hasOwnProperty.call(input, 'email')
          ? { email: toPrismaJson(encryptField(normalize(input.email))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'phone')
          ? { phone: toPrismaJson(encryptField(normalize(input.phone))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'address')
          ? { address: toPrismaJson(encryptField(normalize(input.address))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'bankName')
          ? { bankName: toPrismaJson(encryptField(normalize(input.bankName))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'accountHolder')
          ? { accountHolder: toPrismaJson(encryptField(normalize(input.accountHolder))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'accountNumber')
          ? { accountNumber: toPrismaJson(encryptField(normalize(input.accountNumber))) }
          : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'note')
          ? { note: toPrismaJson(encryptField(normalize(input.note))) }
          : {})
      }
    })

    return this.serializeMember(updated)
  }
}
