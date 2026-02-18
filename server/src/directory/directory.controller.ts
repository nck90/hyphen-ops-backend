import { Body, Controller, Get, Param, Patch } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { DirectoryService } from './directory.service'
import { companyDirectoryUpdateSchema, memberDirectoryUpdateSchema } from './directory.schemas'

@Controller('directory')
export class DirectoryController {
  constructor(private readonly directoryService: DirectoryService) {}

  @Get()
  getSnapshot() {
    return this.directoryService.getSnapshot()
  }

  @Patch('company')
  updateCompany(@Body() body: unknown) {
    return this.directoryService.updateCompany(validateZod(companyDirectoryUpdateSchema, body))
  }

  @Patch('members/:memberId')
  updateMember(@Param('memberId') memberId: string, @Body() body: unknown) {
    return this.directoryService.updateMember(memberId, validateZod(memberDirectoryUpdateSchema, body))
  }
}
