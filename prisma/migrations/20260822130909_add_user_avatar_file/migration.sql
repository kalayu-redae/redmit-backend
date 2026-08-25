/*
  Warnings:

  - You are about to drop the column `avatarfileId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[avatarFileId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "avatarfileId",
ADD COLUMN     "avatarFileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_avatarFileId_key" ON "User"("avatarFileId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_avatarFileId_fkey" FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
