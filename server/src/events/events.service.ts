import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventInput, UpdateEventInput } from './events.schemas'

type AuditContext = {
  traceId?: string
  actorId?: string
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  private toEventDto(event: {
    id: string
    projectId: string
    type: string
    title: string
    status: string
    startAt: Date
    endAt: Date
    ownerId: string
    participants: Array<{ memberId: string }>
  }) {
    return {
      id: event.id,
      projectId: event.projectId,
      type: event.type,
      title: event.title,
      status: event.status,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      ownerId: event.ownerId,
      participantIds: event.participants.map((participant) => participant.memberId)
    }
  }

  private getChangedFields(before: ReturnType<EventsService['toEventDto']>, after: ReturnType<EventsService['toEventDto']>) {
    const keys: Array<keyof ReturnType<EventsService['toEventDto']>> = [
      'projectId',
      'type',
      'title',
      'status',
      'startAt',
      'endAt',
      'ownerId',
      'participantIds'
    ]

    return keys.filter((key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]))
  }

  async list(projectId?: string) {
    const events = await this.prisma.event.findMany({
      where: projectId ? { projectId } : undefined,
      include: { participants: true },
      orderBy: { startAt: 'asc' }
    })

    return events.map((event) => this.toEventDto(event))
  }

  async history(eventId: string) {
    const rows = await this.prisma.eventHistory.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
      take: 80
    })

    return rows.map((row) => ({
      id: row.id,
      eventId: row.eventId,
      action: row.action,
      actorId: row.actorId,
      changedFields: row.changedFields,
      beforeData: row.beforeData,
      afterData: row.afterData,
      createdAt: row.createdAt.toISOString()
    }))
  }

  async create(input: CreateEventInput, context?: AuditContext) {
    const created = await this.prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
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
      const createdDto = this.toEventDto(createdEvent)

      await tx.eventHistory.create({
        data: {
          eventId: createdEvent.id,
          action: 'CREATED',
          actorId: context?.actorId ?? input.ownerId,
          changedFields: Object.keys(createdDto),
          afterData: createdDto
        }
      })
      await tx.actionLog.create({
        data: {
          entityType: 'EVENT',
          entityId: createdEvent.id,
          action: 'CREATED',
          actorId: context?.actorId ?? input.ownerId,
          traceId: context?.traceId,
          metadata: {
            projectId: input.projectId,
            title: input.title
          }
        }
      })

      return createdEvent
    })

    return this.toEventDto(created)
  }

  async update(id: string, input: UpdateEventInput, context?: AuditContext) {
    const exists = await this.prisma.event.findUnique({
      where: { id },
      include: { participants: true }
    })
    if (!exists) {
      throw new NotFoundException(`Event not found: ${id}`)
    }
    const beforeDto = this.toEventDto(exists)

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedEvent = await tx.event.update({
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

      const afterDto = this.toEventDto(updatedEvent)
      const changedFields = this.getChangedFields(beforeDto, afterDto)

      if (changedFields.length > 0) {
        await tx.eventHistory.create({
          data: {
            eventId: id,
            action: 'UPDATED',
            actorId: context?.actorId ?? input.ownerId ?? updatedEvent.ownerId,
            changedFields,
            beforeData: beforeDto,
            afterData: afterDto
          }
        })
        await tx.actionLog.create({
          data: {
            entityType: 'EVENT',
            entityId: id,
            action: 'UPDATED',
            actorId: context?.actorId ?? input.ownerId ?? updatedEvent.ownerId,
            traceId: context?.traceId,
            metadata: {
              changedFields
            }
          }
        })
      }

      return updatedEvent
    })

    return this.toEventDto(updated)
  }

  async remove(id: string, context?: AuditContext) {
    const exists = await this.prisma.event.findUnique({
      where: { id },
      include: { participants: true }
    })
    if (!exists) {
      throw new NotFoundException(`Event not found: ${id}`)
    }
    const beforeDto = this.toEventDto(exists)

    await this.prisma.$transaction(async (tx) => {
      await tx.eventHistory.create({
        data: {
          eventId: id,
          action: 'DELETED',
          actorId: context?.actorId ?? exists.ownerId,
          changedFields: ['*'],
          beforeData: beforeDto
        }
      })
      await tx.actionLog.create({
        data: {
          entityType: 'EVENT',
          entityId: id,
          action: 'DELETED',
          actorId: context?.actorId ?? exists.ownerId,
          traceId: context?.traceId
        }
      })
      await tx.event.delete({ where: { id } })
    })
    return { ok: true }
  }
}
