import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateDocumentLinkInput, UpdateDocumentLinkInput } from './document-links.schemas'

@Injectable()
export class DocumentLinksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId?: string) {
    const links = await this.prisma.documentLink.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' }
    })

    return links.map((link) => ({
      ...link,
      createdAt: link.createdAt.toISOString(),
      updatedAt: link.updatedAt.toISOString()
    }))
  }

  async create(input: CreateDocumentLinkInput) {
    const created = await this.prisma.documentLink.create({
      data: input
    })

    return {
      ...created,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString()
    }
  }

  async update(id: string, input: UpdateDocumentLinkInput) {
    const exists = await this.prisma.documentLink.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(`DocumentLink not found: ${id}`)
    }

    const updated = await this.prisma.documentLink.update({
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
    const exists = await this.prisma.documentLink.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(`DocumentLink not found: ${id}`)
    }

    await this.prisma.documentLink.delete({ where: { id } })
    return { ok: true }
  }
}
