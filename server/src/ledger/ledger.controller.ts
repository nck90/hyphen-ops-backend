import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { LedgerService } from './ledger.service'
import {
  createLedgerEntrySchema,
  updateLedgerEntrySchema,
  updateLedgerSettingsSchema
} from './ledger.schemas'

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('settings')
  getSettings() {
    return this.ledgerService.getSettings()
  }

  @Patch('settings')
  updateSettings(@Body() body: unknown) {
    return this.ledgerService.updateSettings(validateZod(updateLedgerSettingsSchema, body))
  }

  @Get('entries')
  listEntries(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.ledgerService.listEntries({
      projectId: projectId?.trim() || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    })
  }

  @Get('snapshot')
  getSnapshot(
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.ledgerService.getLedgerSnapshot({
      projectId: projectId?.trim() || undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined
    })
  }

  @Post('entries')
  createEntry(@Body() body: unknown) {
    return this.ledgerService.createEntry(validateZod(createLedgerEntrySchema, body))
  }

  @Patch('entries/:id')
  updateEntry(@Param('id') id: string, @Body() body: unknown) {
    return this.ledgerService.updateEntry(id, validateZod(updateLedgerEntrySchema, body))
  }

  @Delete('entries/:id')
  removeEntry(@Param('id') id: string) {
    return this.ledgerService.removeEntry(id)
  }
}
