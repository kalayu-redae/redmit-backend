-- CreateEnum
CREATE TYPE "DigitalAssetType" AS ENUM ('SOCIAL_MEDIA_ACCOUNT', 'WEBSITE', 'DOMAIN', 'YOUTUBE_CHANNEL', 'FACEBOOK_PAGE', 'INSTAGRAM_ACCOUNT', 'TIKTOK_ACCOUNT', 'OTHER');

-- CreateTable
CREATE TABLE "DigitalAsset" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DigitalAssetType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "thumbnailId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DigitalAssetFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DigitalAssetFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalAsset_slug_key" ON "DigitalAsset"("slug");

-- CreateIndex
CREATE INDEX "DigitalAsset_sellerId_idx" ON "DigitalAsset"("sellerId");

-- CreateIndex
CREATE INDEX "DigitalAsset_thumbnailId_idx" ON "DigitalAsset"("thumbnailId");

-- CreateIndex
CREATE INDEX "DigitalAsset_type_idx" ON "DigitalAsset"("type");

-- CreateIndex
CREATE INDEX "DigitalAsset_isActive_idx" ON "DigitalAsset"("isActive");

-- CreateIndex
CREATE INDEX "DigitalAsset_isSold_idx" ON "DigitalAsset"("isSold");

-- CreateIndex
CREATE INDEX "DigitalAsset_createdAt_idx" ON "DigitalAsset"("createdAt");

-- CreateIndex
CREATE INDEX "_DigitalAssetFiles_B_index" ON "_DigitalAssetFiles"("B");

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalAssetFiles" ADD CONSTRAINT "_DigitalAssetFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DigitalAssetFiles" ADD CONSTRAINT "_DigitalAssetFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
