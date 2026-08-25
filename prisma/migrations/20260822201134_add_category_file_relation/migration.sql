/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `Category` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[imageId]` on the table `Category` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" DROP COLUMN "imageUrl",
ADD COLUMN     "imageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Category_imageId_key" ON "Category"("imageId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
