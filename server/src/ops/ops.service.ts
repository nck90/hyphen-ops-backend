import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000
const OPERATIONAL_DAY_START_HOUR = 6
const OVERDUE_PENALTY_PER_TASK = 30000
const DEFAULT_PENALTY_POLICY_START_AT = '2026-02-18T06:00:00+09:00'

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

const overlapsRange = (rangeStart: Date, rangeEnd: Date, windowStart: Date, windowEnd: Date) => {
  return rangeStart < windowEnd && rangeEnd > windowStart
}

@Injectable()
export class OpsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOpsData() {
    const [projects, members, events, logs, assets, documentLinks, ledgerSettings, ledgerEntries] =
      await this.prisma.$transaction([
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
      }),
      this.prisma.ledgerSettings.findUnique({ where: { id: 'default' } }),
      this.prisma.ledgerEntry.findMany({ orderBy: [{ occurredAt: 'asc' }, { createdAt: 'asc' }] })
    ])

    const now = new Date()
    const todayStart = getKstOperationalDayStartUtc(now, 0)
    const tomorrowStart = getKstOperationalDayStartUtc(now, 1)
    const dayAfterTomorrowStart = getKstOperationalDayStartUtc(now, 2)
    const configuredPolicyStart = process.env.PENALTY_POLICY_START_AT?.trim()
    const penaltyPolicyStart = new Date(configuredPolicyStart || DEFAULT_PENALTY_POLICY_START_AT)

    const todayTasks = events.filter((event) =>
      overlapsRange(event.startAt, event.endAt, todayStart, tomorrowStart)
    )
    const tomorrowTasks = events.filter((event) =>
      overlapsRange(event.startAt, event.endAt, tomorrowStart, dayAfterTomorrowStart)
    )
    const overdueUnfinishedTasks = events.filter((event) => {
      if (event.status !== 'PENDING') {
        return false
      }
      if (event.createdAt < penaltyPolicyStart) {
        return false
      }
      if (event.endAt < penaltyPolicyStart) {
        return false
      }
      return event.endAt < todayStart
    })

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

    const memberPenaltyMap = new Map(
      members.map((member) => [
        member.id,
        {
          memberId: member.id,
          memberName: member.name,
          overdueTaskCount: 0,
          penalty: 0
        }
      ])
    )

    for (const event of overdueUnfinishedTasks) {
      const current = memberPenaltyMap.get(event.ownerId)
      if (!current) {
        continue
      }
      current.overdueTaskCount += 1
      current.penalty += OVERDUE_PENALTY_PER_TASK
    }

    const memberPenalties = Array.from(memberPenaltyMap.values()).sort((left, right) =>
      left.memberName.localeCompare(right.memberName, 'ko')
    )
    const overduePenalty = memberPenalties.reduce((sum, memberPenalty) => sum + memberPenalty.penalty, 0)
    const missingPlanPenalty = 0

    const ledgerStartingBalance = ledgerSettings?.startingBalance ?? 0
    let ledgerRunning = ledgerStartingBalance
    const ledgerEntriesWithBalance = ledgerEntries.map((entry) => {
      ledgerRunning += entry.type === 'INCOME' ? entry.amount : -entry.amount
      return {
        ...entry,
        occurredAt: entry.occurredAt.toISOString(),
        createdAt: entry.createdAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
        balanceAfter: ledgerRunning
      }
    })

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
      ledger: {
        startingBalance: ledgerStartingBalance,
        currentBalance: ledgerRunning,
        entries: ledgerEntriesWithBalance
      },
      accountability: {
        todayTaskCount: todayTasks.length,
        tomorrowTaskCount: tomorrowTasks.length,
        overdueUnfinishedTaskCount: overdueUnfinishedTasks.length,
        overdueUnfinishedTasks: overdueUnfinishedTaskDetails,
        policyStartAt: penaltyPolicyStart.toISOString(),
        memberPenalties,
        missingPlanPenalty,
        overduePenalty,
        totalPenalty: missingPlanPenalty + overduePenalty
      }
    }
  }
}
