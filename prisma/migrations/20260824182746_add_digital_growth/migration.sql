-- CreateEnum
CREATE TYPE "DigitalGrowthType" AS ENUM ('SOCIAL_MEDIA_PROMOTION', 'FACEBOOK_ADS', 'TIKTOK_ADS', 'INSTAGRAM_ADS', 'YOUTUBE_ADS', 'GOOGLE_ADS', 'SOCIAL_MEDIA_MONETIZATION', 'OTHER');

-- CreateTable
CREATE TABLE "DigitalGrowth" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DigitalGrowthType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "thumbnailId" TEXT,
    "details" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalGrowth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DigitalGrowthFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DigitalGrowthFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalGrowth_slug_key" ON "DigitalGrowth"("slug");

-- CreateIndex
CREATE INDEX "DigitalGrowth_providerId_idx" ON "DigitalGrowth"("providerId");

-- CreateIndex
CREATE INDEX "DigitalGrowth_type_idx" ON "DigitalGrowth"("type");

-- CreateIndex
CREATE INDEX "DigitalGrowth_isActive_idx" ON "DigitalGrowth"("isActive");

-- CreateIndex
CREATE INDEX "DigitalGrowth_createdAt_idx" ON "DigitalGrowth"("createdAt");

-- CreateIndex
CREATE INDEX "_DigitalGrowthFiles_B_index" ON "_DigitalGrowthFiles"("B");

-- AddForeignKey
ALTER TABLE "DigitalGrowth" ADD CONSTRAINT "DigitalGrowth_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalGrowth" ADD CONSTRAINT "DigitalGrowth_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalGrowthFiles" ADD CONSTRAINT "_DigitalGrowthFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "DigitalGrowth"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalGrowthFiles" ADD CONSTRAINT "_DigitalGrowthFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
