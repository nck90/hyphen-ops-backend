import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const OPERATIONAL_DAY_START_HOUR = 6

const getKstOperationalDayStartUtc = (base: Date, dayOffset: number) => {
  const shifted = new Date(base.getTime() + KST_OFFSET_MS - OPERATIONAL_DAY_START_HOUR * 60 * 60 * 1000)
  const utcSixAmOfKstOperationalDay = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + dayOffset,
    OPERATIONAL_DAY_START_HOUR
  )

  return new Date(utcSixAmOfKstOperationalDay - KST_OFFSET_MS)
}

@Injectable()
export class OpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpsData() {
    const [projects, members, events, logs, assets, documentLinks] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.member.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.event.findMany({
        include: { participants: true },
        orderBy: { startAt: 'asc' }
      }),
      this.prisma.log.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.asset.findMany({
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.documentLink.findMany({
        orderBy: { createdAt: 'desc' }
      })
    ])

    const now = new Date()
    const todayStart = getKstOperationalDayStartUtc(now, 0)
    const tomorrowStart = getKstOperationalDayStartUtc(now, 1)
    const dayAfterTomorrowStart = getKstOperationalDayStartUtc(now, 2)

    const todayTasks = events.filter(
      (event) => event.startAt >= todayStart && event.startAt < tomorrowStart
    )
    const tomorrowTasks = events.filter(
      (event) => event.startAt >= tomorrowStart && event.startAt < dayAfterTomorrowStart
    )
    const overdueUnfinishedTasks = events.filter(
      (event) => event.endAt < todayStart && event.status === 'PENDING'
    )

    const overdueUnfinishedTaskDetails = overdueUnfinishedTasks.map((event) => ({
      id: event.id,
      projectId: event.projectId,
      title: event.title,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt.toISOString(),
      ownerId: event.ownerId,
      status: event.status,
      overdueDays: Math.max(
        1,
        Math.ceil((todayStart.getTime() - event.endAt.getTime()) / (24 * 60 * 60 * 1000))
      )
    }))

    const overduePenalty = overdueUnfinishedTasks.length > 0 ? 30000 : 0
    const missingPlanPenalty = todayTasks.length === 0 && tomorrowTasks.length === 0 ? 30000 : 0

    return {
      projects,
      members,
      events: events.map((event) => ({
        id: event.id,
        projectId: event.projectId,
        type: event.type,
        title: event.title,
        status: event.status,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt.toISOString(),
        ownerId: event.ownerId,
        participantIds: event.participants.map((participant) => participant.memberId)
      })),
      logs: logs.map((log) => ({
        ...log,
        createdAt: log.createdAt.toISOString(),
        updatedAt: log.updatedAt.toISOString()
      })),
      assets: assets.map((asset) => ({
        ...asset,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString()
      })),
      documentLinks: documentLinks.map((documentLink) => ({
        ...documentLink,
        createdAt: documentLink.createdAt.toISOString(),
        updatedAt: documentLink.updatedAt.toISOString()
      })),
      accountability: {
        todayTaskCount: todayTasks.length,
        tomorrowTaskCount: tomorrowTasks.length,
        overdueUnfinishedTaskCount: overdueUnfinishedTasks.length,
        overdueUnfinishedTasks: overdueUnfinishedTaskDetails,
        missingPlanPenalty,
        overduePenalty,
        totalPenalty: missingPlanPenalty + overduePenalty
      }
    }
  }
}
