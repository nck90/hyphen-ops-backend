import { Module } from '@nestjs/common'
import { CollaborationModule } from './collaboration/collaboration.module'
import { AssetsModule } from './assets/assets.module'
import { DocumentLinksModule } from './document-links/document-links.module'
import { EventsModule } from './events/events.module'
import { HealthController } from './health.controller'
import { LogsModule } from './logs/logs.module'
import { LedgerModule } from './ledger/ledger.module'
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
    LedgerModule,
    AssetsModule,
    DocumentLinksModule,
    CollaborationModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
