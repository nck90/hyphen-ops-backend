import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common'
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
  create(@Body() body: unknown, @Req() req: { id?: string }) {
    return this.eventsService.create(validateZod(createEventSchema, body), {
      traceId: req.id
    })
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown, @Req() req: { id?: string }) {
    return this.eventsService.update(id, validateZod(updateEventSchema, body), {
      traceId: req.id
    })
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { id?: string }) {
    return this.eventsService.remove(id, { traceId: req.id })
  }

  @Get(':id/history')
  history(@Param('id') id: string) {
    return this.eventsService.history(id)
  }
}
