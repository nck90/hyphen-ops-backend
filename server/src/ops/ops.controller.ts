import { Controller, Get } from '@nestjs/common'
import { OpsService } from './ops.service'

@Controller('ops-data')
export class OpsController {
  constructor(private readonly opsService: OpsService) {}

  @Get()
  getOpsData() {
    return this.opsService.getOpsData()
  }
}
