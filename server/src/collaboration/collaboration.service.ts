import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const KST_OFFSET_MS = 9 * 60 * 60 * 1000

const getKstStartOfDayUtc = (base: Date, dayOffset: number) => {
  const shifted = new Date(base.getTime() + KST_OFFSET_MS)
  const utcMidnightOfKstDay = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + dayOffset
  )

  return new Date(utcMidnightOfKstDay - KST_OFFSET_MS)
}

@Injectable()
export class CollaborationService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date()
    const rangeStart = getKstStartOfDayUtc(now, 0)
    const rangeEnd = getKstStartOfDayUtc(now, 8)

    const [members, upcomingEvents, orphanLogs, orphanDocuments] = await this.prisma.$transaction([
      this.prisma.member.findMany({
        orderBy: { createdAt: 'asc' }
      }),
      this.prisma.event.findMany({
        where: {
          startAt: {
            gte: rangeStart,
            lt: rangeEnd
          }
        },
        include: { participants: true }
      }),
      this.prisma.log.count({
        where: { eventId: null }
      }),
      this.prisma.documentLink.count({
        where: {
          relatedEventId: null,
          relatedLogId: null
        }
      })
    ])

    const perMember = members.map((member) => {
      const ownerCount = upcomingEvents.filter((event) => event.ownerId === member.id).length
      const participantCount = upcomingEvents.filter((event) =>
        event.participants.some((participant) => participant.memberId === member.id)
      ).length

      return {
        memberId: member.id,
        name: member.name,
        role: member.role,
        ownedEvents: ownerCount,
        participatingEvents: participantCount,
        totalLoad: ownerCount + participantCount
      }
    })

    return {
      teamSize: members.length,
      focus: '일정 기록 + 문서/링크 관리',
      perMember,
      unlinkedLogs: orphanLogs,
      unlinkedDocumentLinks: orphanDocuments
    }
  }
}
