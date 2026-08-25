-- CreateEnum
CREATE TYPE "DigitalAccessType" AS ENUM ('ONLINE_COURSE', 'DOMAIN', 'HOSTING', 'SOFTWARE_SUBSCRIPTION', 'EXAM_REGISTRATION', 'VISA_SERVICE', 'OTHER');

-- CreateTable
CREATE TABLE "DigitalAccess" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DigitalAccessType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "thumbnailId" TEXT,
    "details" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DigitalAccessFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DigitalAccessFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalAccess_slug_key" ON "DigitalAccess"("slug");

-- CreateIndex
CREATE INDEX "DigitalAccess_providerId_idx" ON "DigitalAccess"("providerId");

-- CreateIndex
CREATE INDEX "DigitalAccess_type_idx" ON "DigitalAccess"("type");

-- CreateIndex
CREATE INDEX "DigitalAccess_isActive_idx" ON "DigitalAccess"("isActive");

-- CreateIndex
CREATE INDEX "DigitalAccess_createdAt_idx" ON "DigitalAccess"("createdAt");

-- CreateIndex
CREATE INDEX "_DigitalAccessFiles_B_index" ON "_DigitalAccessFiles"("B");

-- AddForeignKey
ALTER TABLE "DigitalAccess" ADD CONSTRAINT "DigitalAccess_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalAccess" ADD CONSTRAINT "DigitalAccess_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalAccessFiles" ADD CONSTRAINT "_DigitalAccessFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "DigitalAccess"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalAccessFiles" ADD CONSTRAINT "_DigitalAccessFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
