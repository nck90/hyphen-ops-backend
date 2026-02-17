import { Body, Controller, Get, Post } from '@nestjs/common'
import { validateZod } from '../common/validate-zod'
import { createProjectSchema } from './projects.schemas'
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
}

