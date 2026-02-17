import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventInput, UpdateEventInput } from './events.schemas'

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(projectId?: string) {
    const events = await this.prisma.event.findMany({
      where: projectId ? { projectId } : undefined,
      include: { participants: true },
      orderBy: { startAt: 'asc' }
    })

    return events.map((event) => ({
      id: event.id,
      projectId: event.projectId,
      type: event.type,
      title: event.title,
      status: event.status,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      ownerId: event.ownerId,
      participantIds: event.participants.map((participant) => participant.memberId)
    }))
  }

  async create(input: CreateEventInput) {
    const created = await this.prisma.event.create({
      data: {
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        status: input.status,
        startAt: new Date(input.startAt),
        endAt: new Date(input.endAt),
        ownerId: input.ownerId,
        participants: {
          create: input.participantIds.map((memberId) => ({ memberId }))
        }
      },
      include: { participants: true }
    })

    return {
      id: created.id,
      projectId: created.projectId,
      type: created.type,
      title: created.title,
      status: created.status,
      startAt: created.startAt.toISOString(),
      endAt: created.endAt.toISOString(),
      ownerId: created.ownerId,
      participantIds: created.participants.map((participant) => participant.memberId)
    }
  }

  async update(id: string, input: UpdateEventInput) {
    const exists = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(`Event not found: ${id}`)
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        projectId: input.projectId,
        type: input.type,
        title: input.title,
        status: input.status,
        startAt: input.startAt ? new Date(input.startAt) : undefined,
        endAt: input.endAt ? new Date(input.endAt) : undefined,
        ownerId: input.ownerId,
        participants:
          input.participantIds !== undefined
            ? {
                deleteMany: {},
                create: input.participantIds.map((memberId) => ({ memberId }))
              }
            : undefined
      },
      include: { participants: true }
    })

    return {
      id: updated.id,
      projectId: updated.projectId,
      type: updated.type,
      title: updated.title,
      status: updated.status,
      startAt: updated.startAt.toISOString(),
      endAt: updated.endAt.toISOString(),
      ownerId: updated.ownerId,
      participantIds: updated.participants.map((participant) => participant.memberId)
    }
  }

  async remove(id: string) {
    const exists = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true }
    })
    if (!exists) {
      throw new NotFoundException(`Event not found: ${id}`)
    }

    await this.prisma.event.delete({ where: { id } })
    return { ok: true }
  }
}
