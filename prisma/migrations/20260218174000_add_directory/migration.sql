-- CreateTable
CREATE TABLE "CompanyDirectory" (
    "id" TEXT NOT NULL,
    "businessEmail" JSONB,
    "bankName" JSONB,
    "accountHolder" JSONB,
    "accountNumber" JSONB,
    "note" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberDirectory" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "email" JSONB,
    "phone" JSONB,
    "address" JSONB,
    "bankName" JSONB,
    "accountHolder" JSONB,
    "accountNumber" JSONB,
    "note" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberDirectory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberDirectory_memberId_key" ON "MemberDirectory"("memberId");

-- CreateIndex
CREATE INDEX "MemberDirectory_memberId_idx" ON "MemberDirectory"("memberId");

-- AddForeignKey
ALTER TABLE "MemberDirectory" ADD CONSTRAINT "MemberDirectory_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

