/*
  Warnings:

  - A unique constraint covering the columns `[thumbnailId]` on the table `DigitalProduct` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DigitalProduct" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "shortDescription" TEXT,
ADD COLUMN     "thumbnailId" TEXT;

-- CreateTable
CREATE TABLE "ProductFile" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductFile_productId_idx" ON "ProductFile"("productId");

-- CreateIndex
CREATE INDEX "ProductFile_fileId_idx" ON "ProductFile"("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFile_productId_fileId_key" ON "ProductFile"("productId", "fileId");

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_thumbnailId_key" ON "DigitalProduct"("thumbnailId");

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFile" ADD CONSTRAINT "ProductFile_productId_fkey" FOREIGN KEY ("productId") REFERENCES "DigitalProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFile" ADD CONSTRAINT "ProductFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
