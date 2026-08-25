/*
  Warnings:

  - The values [WEBSITE,DOMAIN,YOUTUBE_CHANNEL,FACEBOOK_PAGE,INSTAGRAM_ACCOUNT,TIKTOK_ACCOUNT] on the enum `DigitalAssetType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SocialMediaPlatform" AS ENUM ('FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'LINKEDIN', 'TELEGRAM', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "DigitalAssetType_new" AS ENUM ('SOCIAL_MEDIA_ACCOUNT', 'OTHER');
ALTER TABLE "DigitalAsset" ALTER COLUMN "type" TYPE "DigitalAssetType_new" USING ("type"::text::"DigitalAssetType_new");
ALTER TYPE "DigitalAssetType" RENAME TO "DigitalAssetType_old";
ALTER TYPE "DigitalAssetType_new" RENAME TO "DigitalAssetType";
DROP TYPE "public"."DigitalAssetType_old";
COMMIT;

-- DropIndex
DROP INDEX "DigitalAsset_thumbnailId_idx";

-- CreateTable
CREATE TABLE "SocialMediaAsset" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "platform" "SocialMediaPlatform" NOT NULL,
    "username" TEXT,
    "profileUrl" TEXT,
    "followers" INTEGER,
    "following" INTEGER,
    "posts" INTEGER,
    "views" INTEGER,
    "country" TEXT,
    "niche" TEXT,
    "engagementRate" DECIMAL(5,2),
    "monthlyRevenue" DECIMAL(12,2),
    "revenueCurrency" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialMediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OtherAsset" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "category" TEXT,
    "url" TEXT,
    "platform" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OtherAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialMediaAsset_assetId_key" ON "SocialMediaAsset"("assetId");

-- CreateIndex
CREATE UNIQUE INDEX "OtherAsset_assetId_key" ON "OtherAsset"("assetId");

-- AddForeignKey
ALTER TABLE "SocialMediaAsset" ADD CONSTRAINT "SocialMediaAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OtherAsset" ADD CONSTRAINT "OtherAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
