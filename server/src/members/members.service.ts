import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMemberInput } from './members.schemas'

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.member.findMany({
      orderBy: { createdAt: 'asc' }
    })
  }

  create(input: CreateMemberInput) {
    return this.prisma.member.create({
      data: input
    })
  }
}

