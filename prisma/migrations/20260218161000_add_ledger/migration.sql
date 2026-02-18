-- CreateTable
CREATE TABLE "LedgerSettings" (
    "id" TEXT NOT NULL,
    "startingBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "note" TEXT,
    "projectId" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LedgerEntry_occurredAt_idx" ON "LedgerEntry"("occurredAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_projectId_idx" ON "LedgerEntry"("projectId");

-- CreateIndex
CREATE INDEX "LedgerEntry_externalId_idx" ON "LedgerEntry"("externalId");

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
