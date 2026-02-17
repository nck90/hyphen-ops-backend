import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { createEventSchema, updateEventSchema } from './events.schemas'
import { EventsService } from './events.service'

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.eventsService.list(projectId)
  }

  @Post()
  create(@Body() body: unknown) {
    return this.eventsService.create(validateZod(createEventSchema, body))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.eventsService.update(id, validateZod(updateEventSchema, body))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id)
  }
}
