import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { createProjectSchema, updateProjectSchema } from './projects.schemas'
import { ProjectsService } from './projects.service'

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list() {
    return this.projectsService.list()
  }

  @Post()
  create(@Body() body: unknown) {
    return this.projectsService.create(validateZod(createProjectSchema, body))
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.projectsService.update(id, validateZod(updateProjectSchema, body))
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id)
  }
}
