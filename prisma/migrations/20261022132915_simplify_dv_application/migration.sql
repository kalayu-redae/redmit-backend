/*
  Warnings:

  - You are about to drop the column `isPublic` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `dvApplicationId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `DVApplication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVDocument` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVPerson` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DVApplicationFiles` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "DigitalProductStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "DigitalProductType" AS ENUM ('DOWNLOAD', 'COURSE', 'SOFTWARE', 'DIGITAL_RESOURCE');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DVRequestType" AS ENUM ('PAYMENT_ASSISTANCE', 'FORM_FILLING');

-- CreateEnum
CREATE TYPE "DVRequestStatus" AS ENUM ('PENDING_PAYMENT', 'PAYMENT_REVIEW', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "DVApplication" DROP CONSTRAINT "DVApplication_orderId_fkey";

-- DropForeignKey
ALTER TABLE "DVApplication" DROP CONSTRAINT "DVApplication_providerId_fkey";

-- DropForeignKey
ALTER TABLE "DVApplication" DROP CONSTRAINT "DVApplication_thumbnailId_fkey";

-- DropForeignKey
ALTER TABLE "DVApplication" DROP CONSTRAINT "DVApplication_userId_fkey";

-- DropForeignKey
ALTER TABLE "DVDocument" DROP CONSTRAINT "DVDocument_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVDocument" DROP CONSTRAINT "DVDocument_fileId_fkey";

-- DropForeignKey
ALTER TABLE "DVDocument" DROP CONSTRAINT "DVDocument_personId_fkey";

-- DropForeignKey
ALTER TABLE "DVPerson" DROP CONSTRAINT "DVPerson_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_dvApplicationId_fkey";

-- DropForeignKey
ALTER TABLE "_DVApplicationFiles" DROP CONSTRAINT "_DVApplicationFiles_A_fkey";

-- DropForeignKey
ALTER TABLE "_DVApplicationFiles" DROP CONSTRAINT "_DVApplicationFiles_B_fkey";

-- DropIndex
DROP INDEX "OrderItem_dvApplicationId_idx";

-- AlterTable
ALTER TABLE "DigitalProduct" ADD COLUMN     "status" "DigitalProductStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "type" "DigitalProductType" NOT NULL DEFAULT 'DOWNLOAD';

-- AlterTable
ALTER TABLE "File" DROP COLUMN "isPublic",
ADD COLUMN     "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
ALTER COLUMN "url" DROP NOT NULL,
ALTER COLUMN "size" SET DATA TYPE BIGINT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "dvApplicationId";

-- DropTable
DROP TABLE "DVApplication";

-- DropTable
DROP TABLE "DVDocument";

-- DropTable
DROP TABLE "DVPerson";

-- DropTable
DROP TABLE "_DVApplicationFiles";

-- DropEnum
DROP TYPE "DVApplicationStatus";

-- DropEnum
DROP TYPE "DVDocumentType";

-- DropEnum
DROP TYPE "DVPersonType";

-- CreateTable
CREATE TABLE "DVApplicationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "DVRequestType" NOT NULL,
    "status" "DVRequestStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "needsInternationalPayment" BOOLEAN NOT NULL DEFAULT true,
    "applicantDetails" JSONB,
    "serviceFee" DECIMAL(12,2) NOT NULL,
    "internationalPaymentFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "orderId" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVApplicationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DVApplicationRequest_orderId_key" ON "DVApplicationRequest"("orderId");

-- CreateIndex
CREATE INDEX "DVApplicationRequest_userId_idx" ON "DVApplicationRequest"("userId");

-- CreateIndex
CREATE INDEX "DVApplicationRequest_status_idx" ON "DVApplicationRequest"("status");

-- CreateIndex
CREATE INDEX "DVApplicationRequest_requestType_idx" ON "DVApplicationRequest"("requestType");

-- CreateIndex
CREATE INDEX "DVApplicationRequest_createdAt_idx" ON "DVApplicationRequest"("createdAt");

-- CreateIndex
CREATE INDEX "DigitalProduct_status_idx" ON "DigitalProduct"("status");

-- CreateIndex
CREATE INDEX "DigitalProduct_type_idx" ON "DigitalProduct"("type");

-- CreateIndex
CREATE INDEX "File_category_idx" ON "File"("category");

-- CreateIndex
CREATE INDEX "File_visibility_idx" ON "File"("visibility");

-- CreateIndex
CREATE INDEX "File_createdAt_idx" ON "File"("createdAt");

-- AddForeignKey
ALTER TABLE "DVApplicationRequest" ADD CONSTRAINT "DVApplicationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicationRequest" ADD CONSTRAINT "DVApplicationRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
