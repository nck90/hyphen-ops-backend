import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
  @Get('/health')
  getHealth() {
    return {
      ok: true,
      service: 'hyphen-ops-api',
      timestamp: new Date().toISOString()
    }
  }
}
