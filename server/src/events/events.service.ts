import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateEventInput, ImportMarchPlanInput, UpdateEventInput } from './events.schemas'

type AuditContext = {
  traceId?: string
  actorId?: string
}

const DEFAULT_MARCH_PLAN_START_DATE = '2026-03-02'
const DEFAULT_MARCH_PLAN_PROJECT_NAME = 'AX 솔루션 사업계획'
const DEFAULT_MARCH_PLAN_OWNER_NAME = 'PM'
const DEFAULT_MARCH_PLAN_PROJECT_COLOR = '#2563eb'
const DEFAULT_MARCH_PLAN_MEMBER_COLOR = '#0891b2'

type MarchPlanSlot = {
  dayOffset: number
  startHour: number
  endHour: number
  title: string
}

const MARCH_PLAN_TEMPLATE: MarchPlanSlot[] = [
  {
    dayOffset: 0,
    startHour: 22,
    endHour: 24,
    title: '윤정님 일정 캔슬 대응: 미팅 최소 1건 확보 + 보험/콜센터/영업/여행사 리스트업'
  },
  { dayOffset: 1, startHour: 10, endHour: 12, title: 'GPT PRO 기반 사업계획서 정리본 추출' },
  { dayOffset: 1, startHour: 14, endHour: 16, title: '핵심문제/타겟고객 정의 + 리서치 + 솔루션 1차/IA 작성' },
  { dayOffset: 1, startHour: 22, endHour: 24, title: 'AX 로드맵 작성: 소싱 완료시점 및 행사 연계 타이밍 정의' },
  { dayOffset: 2, startHour: 10, endHour: 12, title: '외주시장 통계조사 + 분쟁사례/자료 수집' },
  { dayOffset: 2, startHour: 14, endHour: 16, title: 'As-Is → To-Be 문제정의 + 고객 페르소나 작성' },
  { dayOffset: 2, startHour: 22, endHour: 24, title: '행사 제안서 1차 초안 작성(러프 아이디어 구체화)' },
  { dayOffset: 3, startHour: 10, endHour: 12, title: '솔루션 기능 상세 정의' },
  { dayOffset: 3, startHour: 14, endHour: 16, title: '경쟁 툴/솔루션 리서치 및 비교표 작성' },
  { dayOffset: 3, startHour: 22, endHour: 24, title: '미팅 후: AX 개발 / 미팅 전: 4d 미팅 세팅 + 쓰레드 포스팅' },
  { dayOffset: 4, startHour: 10, endHour: 12, title: '시장규모 추정(TAM/SAM/SOM)' },
  { dayOffset: 4, startHour: 14, endHour: 16, title: '왜 필요한지 트렌드 조사 + 설득 포인트 구상' },
  { dayOffset: 4, startHour: 22, endHour: 24, title: 'AX솔루션 기획안 최종 + 프로세스 자동화 제안서' },
  { dayOffset: 5, startHour: 10, endHour: 12, title: '가격 책정 설계(경쟁사 수익모델 리서치 연동)' },
  { dayOffset: 5, startHour: 14, endHour: 16, title: '매출 시뮬레이션 및 영업전략 구상' },
  { dayOffset: 6, startHour: 10, endHour: 12, title: '커밋틀리 로드맵 작성' },
  { dayOffset: 6, startHour: 14, endHour: 16, title: 'PoC/정식개발/정식런칭 일정 및 목표 작성' },
  { dayOffset: 6, startHour: 22, endHour: 24, title: 'AX솔루션 개발' },
  { dayOffset: 7, startHour: 10, endHour: 12, title: '대표자 역량 및 팀 역량 정리' },
  { dayOffset: 7, startHour: 14, endHour: 16, title: '내용 통합정리 및 사업계획서 2차 작성' },
  { dayOffset: 7, startHour: 22, endHour: 24, title: 'AX솔루션 개발' },
  { dayOffset: 8, startHour: 10, endHour: 12, title: '2차 사업계획서 피드백 반영' },
  { dayOffset: 8, startHour: 14, endHour: 16, title: '사업계획서 이미지 정리' },
  { dayOffset: 8, startHour: 22, endHour: 24, title: 'AX솔루션 개발' },
  { dayOffset: 9, startHour: 10, endHour: 12, title: '사업계획서 최종안 작성' },
  { dayOffset: 9, startHour: 14, endHour: 16, title: '검수/피드백 반영 및 제출 준비' },
  { dayOffset: 9, startHour: 22, endHour: 24, title: 'AX솔루션 공유/테스트 및 도입 준비' }
]

const DATE_KEY_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/

const parseDateKey = (dateKey: string) => {
  const matched = DATE_KEY_REGEX.exec(dateKey)
  if (!matched) {
    return null
  }

  const year = Number(matched[1])
  const month = Number(matched[2])
  const day = Number(matched[3])
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }

  return date
}

const toDateKey = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toKstDateTime = (date: Date, hour: number) => {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      hour - 9,
      0,
      0,
      0
    )
  )
}

const createProjectSlug = (projectName: string) => {
  const base = projectName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

  return `${base || 'ax-plan'}-${Date.now().toString(36)}`
}

const getMarchPlanEventType = (title: string) => {
  if (title.includes('미팅') || title.includes('행사')) {
    return '회의'
  }
  if (title.includes('리서치') || title.includes('조사')) {
    return '리서치'
  }
  if (title.includes('개발')) {
    return '개발'
  }
  return '기획'
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
    try {
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
    } catch (error) {
      // Some deployments may not have audit tables yet. History must not hard-fail core UX.
      console.warn('Failed to load event history', { eventId, error })
      return []
    }
  }

  async importMarchPlan(input: ImportMarchPlanInput, context?: AuditContext) {
    const startDateKey = input.startDate?.trim() || DEFAULT_MARCH_PLAN_START_DATE
    const baseDate = parseDateKey(startDateKey)
    if (!baseDate) {
      throw new BadRequestException(`Invalid startDate: ${startDateKey}`)
    }

    const projectName = input.projectName?.trim() || DEFAULT_MARCH_PLAN_PROJECT_NAME
    const ownerName = input.ownerName?.trim() || DEFAULT_MARCH_PLAN_OWNER_NAME

    let project = await this.prisma.project.findFirst({
      where: { name: projectName },
      orderBy: { createdAt: 'asc' }
    })
    if (!project) {
      project = await this.prisma.project.create({
        data: {
          slug: createProjectSlug(projectName),
          name: projectName,
          color: DEFAULT_MARCH_PLAN_PROJECT_COLOR,
          status: 'ACTIVE',
          summary: '3월 2일~11일 사업계획서/AX 솔루션 집중 일정'
        }
      })
    }

    let owner = await this.prisma.member.findFirst({
      where: { name: ownerName },
      orderBy: { createdAt: 'asc' }
    })
    if (!owner) {
      owner = await this.prisma.member.create({
        data: {
          name: ownerName,
          role: 'PM',
          color: DEFAULT_MARCH_PLAN_MEMBER_COLOR
        }
      })
    }

    const rangeStart = toKstDateTime(baseDate, 0)
    const rangeEnd = toKstDateTime(new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() + 12)), 0)

    const existing = await this.prisma.event.findMany({
      where: {
        projectId: project.id,
        startAt: {
          gte: rangeStart,
          lt: rangeEnd
        }
      },
      select: {
        title: true,
        startAt: true,
        endAt: true
      }
    })

    const existingKeys = new Set(
      existing.map((row) => `${row.title}|${row.startAt.toISOString()}|${row.endAt.toISOString()}`)
    )

    let createdCount = 0
    let skippedCount = 0

    await this.prisma.$transaction(async (tx) => {
      for (const slot of MARCH_PLAN_TEMPLATE) {
        const slotDate = new Date(
          Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() + slot.dayOffset)
        )
        const startAt = toKstDateTime(slotDate, slot.startHour)
        const endAt = toKstDateTime(slotDate, slot.endHour)
        const key = `${slot.title}|${startAt.toISOString()}|${endAt.toISOString()}`

        if (existingKeys.has(key)) {
          skippedCount += 1
          continue
        }

        const createdEvent = await tx.event.create({
          data: {
            projectId: project.id,
            type: getMarchPlanEventType(slot.title),
            title: slot.title,
            startAt,
            endAt,
            ownerId: owner.id,
            participants: {
              create: [{ memberId: owner.id }]
            }
          }
        })

        createdCount += 1
        existingKeys.add(key)

        await tx.actionLog.create({
          data: {
            entityType: 'EVENT',
            entityId: createdEvent.id,
            action: 'IMPORTED',
            actorId: context?.actorId ?? owner.id,
            traceId: context?.traceId,
            metadata: {
              source: 'march-plan-template',
              startDate: startDateKey
            }
          }
        })
      }
    })

    return {
      ok: true,
      startDate: startDateKey,
      endDate: toDateKey(new Date(Date.UTC(baseDate.getUTCFullYear(), baseDate.getUTCMonth(), baseDate.getUTCDate() + 9))),
      projectId: project.id,
      projectName: project.name,
      ownerId: owner.id,
      ownerName: owner.name,
      createdCount,
      skippedCount,
      totalCount: MARCH_PLAN_TEMPLATE.length
    }
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

    const afterDto = this.toEventDto(updated)
    const changedFields = this.getChangedFields(beforeDto, afterDto)

    if (changedFields.length > 0) {
      try {
        await this.prisma.$transaction([
          this.prisma.eventHistory.create({
            data: {
              eventId: id,
              action: 'UPDATED',
              actorId: context?.actorId ?? input.ownerId ?? updated.ownerId,
              changedFields,
              beforeData: beforeDto,
              afterData: afterDto
            }
          }),
          this.prisma.actionLog.create({
            data: {
              entityType: 'EVENT',
              entityId: id,
              action: 'UPDATED',
              actorId: context?.actorId ?? input.ownerId ?? updated.ownerId,
              traceId: context?.traceId,
              metadata: {
                changedFields
              }
            }
          })
        ])
      } catch (error) {
        // Audit failure should not block core schedule updates.
        console.error('Failed to persist event audit trail', { eventId: id, error })
      }
    }

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
