import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(todayStart.getDate() + 1)
    const dayAfterTomorrowStart = new Date(todayStart)
    dayAfterTomorrowStart.setDate(todayStart.getDate() + 2)

    const todayTasks = events.filter(
      (event) => event.startAt >= todayStart && event.startAt < tomorrowStart
    )
    const tomorrowTasks = events.filter(
      (event) => event.startAt >= tomorrowStart && event.startAt < dayAfterTomorrowStart
    )
    const overdueUnfinishedTasks = events.filter(
      (event) => event.endAt < todayStart && event.status !== 'DONE'
    )

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
        missingPlanPenalty,
        overduePenalty,
        totalPenalty: missingPlanPenalty + overduePenalty
      }
    }
  }
}
