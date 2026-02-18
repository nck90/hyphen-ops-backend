import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { AssetsService } from './assets.service'
import { createAssetSchema, updateAssetSchema } from './assets.schemas'

@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.assetsService.list(projectId)
  }

  @Post()
  create(@Body() body: unknown) {
    return this.assetsService.create(validateZod(createAssetSchema, body))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.assetsService.update(id, validateZod(updateAssetSchema, body))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id)
  }
}
