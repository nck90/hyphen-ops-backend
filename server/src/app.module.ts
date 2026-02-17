import { Module } from '@nestjs/common'
import { CollaborationModule } from './collaboration/collaboration.module'
import { DocumentLinksModule } from './document-links/document-links.module'
import { EventsModule } from './events/events.module'
import { HealthController } from './health.controller'
import { LogsModule } from './logs/logs.module'
import { MembersModule } from './members/members.module'
import { OpsModule } from './ops/ops.module'
import { PrismaModule } from './prisma/prisma.module'
import { ProjectsModule } from './projects/projects.module'

@Module({
  imports: [
    PrismaModule,
    OpsModule,
    ProjectsModule,
    MembersModule,
    EventsModule,
    LogsModule,
    DocumentLinksModule,
    CollaborationModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
