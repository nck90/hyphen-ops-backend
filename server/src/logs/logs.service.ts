import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLogInput, UpdateLogInput } from './logs.schemas'

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId?: string) {
    const logs = await this.prisma.log.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    return logs.map((log) => ({
      ...log,
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }))
  }

  async create(input: CreateLogInput) {
    const created = await this.prisma.log.create({
      data: input
    })

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  }

  async update(id: string, input: UpdateLogInput) {
    const exists = await this.prisma.log.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(`Log not found: ${id}`)
    }

    const updated = await this.prisma.log.update({
      where: { id },
      data: input
    })

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString()
    }
  }

  async remove(id: string) {
    const deleted = await this.prisma.log.deleteMany({
      where: { id }
    })

    if (deleted.count === 0) {
      throw new NotFoundException(`Log not found: ${id}`)
    }

    return { ok: true, deletedCount: deleted.count }
  }
}
