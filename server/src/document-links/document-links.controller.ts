import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import {
  createDocumentLinkSchema,
  updateDocumentLinkSchema
} from './document-links.schemas'
import { DocumentLinksService } from './document-links.service'

@Controller('document-links')
export class DocumentLinksController {
  constructor(private readonly documentLinksService: DocumentLinksService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.documentLinksService.list(projectId)
  }

  @Post()
  create(@Body() body: unknown) {
    return this.documentLinksService.create(validateZod(createDocumentLinkSchema, body))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.documentLinksService.update(id, validateZod(updateDocumentLinkSchema, body))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentLinksService.remove(id)
  }
}
