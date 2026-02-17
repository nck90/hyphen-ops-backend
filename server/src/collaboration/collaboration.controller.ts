import { Controller, Get } from '@nestjs/common'
import { CollaborationService } from './collaboration.service'

@Controller('collaboration')
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Get('summary')
  getSummary() {
    return this.collaborationService.getSummary()
  }
}
