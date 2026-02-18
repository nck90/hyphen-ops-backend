import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAssetInput, UpdateAssetInput } from './assets.schemas'

@Injectable()
export class AssetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId?: string) {
    const assets = await this.prisma.asset.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    return assets.map((asset) => ({
      ...asset,
      createdAt: asset.createdAt.toISOString(),
      updatedAt: asset.updatedAt.toISOString()
    }))
  }

  async create(input: CreateAssetInput) {
    const created = await this.prisma.asset.create({
      data: input
    })

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  }

  async update(id: string, input: UpdateAssetInput) {
    const exists = await this.prisma.asset.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`Asset not found: ${id}`)
    }

    const updated = await this.prisma.asset.update({
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
    const exists = await this.prisma.asset.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`Asset not found: ${id}`)
    }

    await this.prisma.asset.delete({ where: { id } })
    return { ok: true }
  }
}
