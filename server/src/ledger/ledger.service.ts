import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type {
  CreateLedgerEntryInput,
  UpdateLedgerEntryInput,
  UpdateLedgerSettingsInput
} from './ledger.schemas'

const SETTINGS_ID = 'default'

const serializeEntry = (entry: any) => ({
  ...entry,
  occurredAt: entry.occurredAt.toISOString(),
  createdAt: entry.createdAt.toISOString(),
  updatedAt: entry.updatedAt.toISOString()
})

@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const settings = await this.prisma.ledgerSettings.findUnique({ where: { id: SETTINGS_ID } })
    if (settings) {
      return {
        ...settings,
        createdAt: settings.createdAt.toISOString(),
        updatedAt: settings.updatedAt.toISOString()
      }
    }

    const created = await this.prisma.ledgerSettings.create({
      data: { id: SETTINGS_ID, startingBalance: 0 }
    })

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  }

  async updateSettings(input: UpdateLedgerSettingsInput) {
    const updated = await this.prisma.ledgerSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID, startingBalance: input.startingBalance },
      update: { startingBalance: input.startingBalance }
    })

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  }

  async listEntries(params?: {
    projectId?: string
    from?: Date
    to?: Date
  }) {
    const { projectId, from, to } = params ?? {}

    const entries = await this.prisma.ledgerEntry.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(from || to
          ? {
              occurredAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {})
              }
            }
          : {})
      },
      orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }]
    })

    return entries.map(serializeEntry)
  }

  async createEntry(input: CreateLedgerEntryInput) {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date()

    const created = await this.prisma.ledgerEntry.create({
      data: {
        occurredAt,
        type: input.type,
        category: input.category,
        detail: input.detail,
        amount: input.amount,
        note: input.note,
        projectId: input.projectId,
        externalId: input.externalId
      }
    })

    return serializeEntry(created)
  }

  async updateEntry(id: string, input: UpdateLedgerEntryInput) {
    const exists = await this.prisma.ledgerEntry.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`LedgerEntry not found: ${id}`)
    }

    const updated = await this.prisma.ledgerEntry.update({
      where: { id },
      data: {
        ...(input.occurredAt ? { occurredAt: new Date(input.occurredAt) } : {}),
        ...(input.type ? { type: input.type } : {}),
        ...(input.category ? { category: input.category } : {}),
        ...(input.detail ? { detail: input.detail } : {}),
        ...(typeof input.amount === 'number' ? { amount: input.amount } : {}),
        ...(typeof input.note !== 'undefined' ? { note: input.note } : {}),
        ...(typeof input.projectId !== 'undefined' ? { projectId: input.projectId } : {}),
        ...(typeof input.externalId !== 'undefined' ? { externalId: input.externalId } : {})
      }
    })

    return serializeEntry(updated)
  }

  async removeEntry(id: string) {
    const exists = await this.prisma.ledgerEntry.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`LedgerEntry not found: ${id}`)
    }

    await this.prisma.ledgerEntry.delete({ where: { id } })
    return { ok: true }
  }

  async getLedgerSnapshot(params?: { projectId?: string; from?: Date; to?: Date }) {
    const settings = await this.getSettings()
    const entries = await this.listEntries(params)

    let running = settings.startingBalance
    const entriesWithBalance = entries.map((entry) => {
      running += entry.type === 'INCOME' ? entry.amount : -entry.amount
      return { ...entry, balanceAfter: running }
    })

    return {
      startingBalance: settings.startingBalance,
      entries: entriesWithBalance,
      currentBalance: running
    }
  }
}
