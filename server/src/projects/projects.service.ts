import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProjectInput, UpdateProjectInput } from './projects.schemas'

const slugify = (raw: string) =>
  raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.project.findMany({
      orderBy: { createdAt: 'asc' }
    })
  }

  async create(input: CreateProjectInput) {
    const baseSlug = slugify(input.slug ?? input.name) || 'project'

    let slug = baseSlug
    let suffix = 1
    while (await this.prisma.project.findUnique({ where: { slug }, select: { id: true } })) {
      slug = `${baseSlug}-${suffix}`
      suffix += 1
    }

    return this.prisma.project.create({
      data: {
        name: input.name,
        slug,
        color: input.color,
        status: input.status,
        summary: input.summary
      }
    })
  }

  async update(id: string, input: UpdateProjectInput) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`Project not found: ${id}`)
    }

    return this.prisma.project.update({
      where: { id },
      data: input
    })
  }

  async remove(id: string) {
    const exists = await this.prisma.project.findUnique({ where: { id }, select: { id: true } })
    if (!exists) {
      throw new NotFoundException(`Project not found: ${id}`)
    }

    await this.prisma.project.delete({ where: { id } })
    return { ok: true }
  }
}
