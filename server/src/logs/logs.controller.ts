import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { createLogSchema, updateLogSchema } from './logs.schemas'
import { LogsService } from './logs.service'

@Controller('logs')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.logsService.list(projectId)
  }

  @Post()
  create(@Body() body: unknown) {
    return this.logsService.create(validateZod(createLogSchema, body))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.logsService.update(id, validateZod(updateLogSchema, body))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.logsService.remove(id)
  }
}
