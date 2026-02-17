import { Body, Controller, Get, Post } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { createMemberSchema } from './members.schemas'
import { MembersService } from './members.service'

@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  list() {
    return this.membersService.list()
  }

  @Post()
  create(@Body() body: unknown) {
    return this.membersService.create(validateZod(createMemberSchema, body))
  }
}

