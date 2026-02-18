-- Add audit trail tables used by EventsService and related APIs.

-- CreateTable
CREATE TABLE "EventHistory" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "changedFields" JSONB,
    "beforeData" JSONB,
    "afterData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventHistory_eventId_createdAt_idx" ON "EventHistory"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "EventHistory_createdAt_idx" ON "EventHistory"("createdAt");

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "traceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActionLog_entityType_entityId_createdAt_idx" ON "ActionLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "ActionLog_createdAt_idx" ON "ActionLog"("createdAt");

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "memberId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "scheduledAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_projectId_createdAt_idx" ON "Notification"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_memberId_createdAt_idx" ON "Notification"("memberId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_isRead_createdAt_idx" ON "Notification"("isRead", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
