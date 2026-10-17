/*
  Warnings:

  - The values [DRAFT,INFORMATION_REQUIRED,PREPARING,AWAITING_APPLICANT_APPROVAL,READY_FOR_SUBMISSION,PAYMENT_PENDING,PAYMENT_VERIFIED,OFFICIAL_PAYMENT_PENDING,READY_FOR_REGISTRATION,CONFIRMED,RESULT_CHECK_ASSISTANCE,CLOSED] on the enum `DVApplicationStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [PASSPORT] on the enum `DVDocumentType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `closedAt` on the `DVApplication` table. All the data in the column will be lost.
  - You are about to drop the column `customerNotes` on the `DVApplication` table. All the data in the column will be lost.
  - You are about to drop the column `officialFeeAmount` on the `DVApplication` table. All the data in the column will be lost.
  - You are about to drop the column `serviceFee` on the `DVApplication` table. All the data in the column will be lost.
  - You are about to drop the column `staffNotes` on the `DVApplication` table. All the data in the column will be lost.
  - You are about to drop the column `familyMemberId` on the `DVDocument` table. All the data in the column will be lost.
  - You are about to drop the column `reviewNotesEnc` on the `DVDocument` table. All the data in the column will be lost.
  - You are about to drop the column `reviewedAt` on the `DVDocument` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `DVDocument` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `DVDocument` table. All the data in the column will be lost.
  - You are about to drop the column `dvAssistanceId` on the `OrderItem` table. All the data in the column will be lost.
  - You are about to drop the `DVApplicantDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVApplicationReview` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVFamilyMember` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVOfficialPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DVSubmissionRecord` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `DvAssistance` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_DvAssistanceFiles` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[applicationId,fileId]` on the table `DVDocument` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `price` to the `DVApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `DVApplication` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DVPersonType" AS ENUM ('APPLICANT', 'SPOUSE', 'CHILD');

-- AlterEnum
BEGIN;
CREATE TYPE "DVApplicationStatus_new" AS ENUM ('REQUESTED', 'UNDER_REVIEW', 'AWAITING_PAYMENT', 'PAID', 'PROCESSING', 'SUBMITTED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."DVApplication" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "DVApplication" ALTER COLUMN "status" TYPE "DVApplicationStatus_new" USING ("status"::text::"DVApplicationStatus_new");
ALTER TYPE "DVApplicationStatus" RENAME TO "DVApplicationStatus_old";
ALTER TYPE "DVApplicationStatus_new" RENAME TO "DVApplicationStatus";
DROP TYPE "public"."DVApplicationStatus_old";
ALTER TABLE "DVApplication" ALTER COLUMN "status" SET DEFAULT 'REQUESTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "DVDocumentType_new" AS ENUM ('APPLICANT_PHOTO', 'SPOUSE_PHOTO', 'CHILD_PHOTO', 'PASSPORT_PHOTO', 'BIRTH_CERTIFICATE_PHOTO', 'OFFICIAL_PAYMENT_RECEIPT', 'CONFIRMATION_DOCUMENT', 'OTHER');
ALTER TABLE "DVDocument" ALTER COLUMN "type" TYPE "DVDocumentType_new" USING ("type"::text::"DVDocumentType_new");
ALTER TYPE "DVDocumentType" RENAME TO "DVDocumentType_old";
ALTER TYPE "DVDocumentType_new" RENAME TO "DVDocumentType";
DROP TYPE "public"."DVDocumentType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "DVApplicantDetails" DROP CONSTRAINT "DVApplicantDetails_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVApplicationReview" DROP CONSTRAINT "DVApplicationReview_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVApplicationReview" DROP CONSTRAINT "DVApplicationReview_reviewerId_fkey";

-- DropForeignKey
ALTER TABLE "DVDocument" DROP CONSTRAINT "DVDocument_familyMemberId_fkey";

-- DropForeignKey
ALTER TABLE "DVDocument" DROP CONSTRAINT "DVDocument_fileId_fkey";

-- DropForeignKey
ALTER TABLE "DVFamilyMember" DROP CONSTRAINT "DVFamilyMember_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVOfficialPayment" DROP CONSTRAINT "DVOfficialPayment_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVOfficialPayment" DROP CONSTRAINT "DVOfficialPayment_recordedByUserId_fkey";

-- DropForeignKey
ALTER TABLE "DVSubmissionRecord" DROP CONSTRAINT "DVSubmissionRecord_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "DVSubmissionRecord" DROP CONSTRAINT "DVSubmissionRecord_handledByUserId_fkey";

-- DropForeignKey
ALTER TABLE "DvAssistance" DROP CONSTRAINT "DvAssistance_providerId_fkey";

-- DropForeignKey
ALTER TABLE "DvAssistance" DROP CONSTRAINT "DvAssistance_thumbnailId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_dvAssistanceId_fkey";

-- DropForeignKey
ALTER TABLE "_DvAssistanceFiles" DROP CONSTRAINT "_DvAssistanceFiles_A_fkey";

-- DropForeignKey
ALTER TABLE "_DvAssistanceFiles" DROP CONSTRAINT "_DvAssistanceFiles_B_fkey";

-- DropIndex
DROP INDEX "DVApplication_userId_status_idx";

-- DropIndex
DROP INDEX "DVDocument_applicationId_status_idx";

-- DropIndex
DROP INDEX "DVDocument_familyMemberId_idx";

-- DropIndex
DROP INDEX "DVDocument_fileId_key";

-- DropIndex
DROP INDEX "OrderItem_dvAssistanceId_idx";

-- AlterTable
ALTER TABLE "DVApplication" DROP COLUMN "closedAt",
DROP COLUMN "customerNotes",
DROP COLUMN "officialFeeAmount",
DROP COLUMN "serviceFee",
DROP COLUMN "staffNotes",
ADD COLUMN     "confirmationNumberEncrypted" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "details" JSONB,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'DV Application Assistance',
ADD COLUMN     "price" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "thumbnailId" TEXT,
ALTER COLUMN "status" SET DEFAULT 'REQUESTED';

-- AlterTable
ALTER TABLE "DVDocument" DROP COLUMN "familyMemberId",
DROP COLUMN "reviewNotesEnc",
DROP COLUMN "reviewedAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "personId" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" DROP COLUMN "dvAssistanceId",
ADD COLUMN     "dvApplicationId" TEXT;

-- DropTable
DROP TABLE "DVApplicantDetails";

-- DropTable
DROP TABLE "DVApplicationReview";

-- DropTable
DROP TABLE "DVFamilyMember";

-- DropTable
DROP TABLE "DVOfficialPayment";

-- DropTable
DROP TABLE "DVSubmissionRecord";

-- DropTable
DROP TABLE "DvAssistance";

-- DropTable
DROP TABLE "_DvAssistanceFiles";

-- DropEnum
DROP TYPE "DVDocumentStatus";

-- DropEnum
DROP TYPE "DVEducationLevel";

-- DropEnum
DROP TYPE "DVFamilyRelationship";

-- DropEnum
DROP TYPE "DVGender";

-- DropEnum
DROP TYPE "DVMaritalStatus";

-- DropEnum
DROP TYPE "DVOfficialPaymentStatus";

-- DropEnum
DROP TYPE "DVReviewStatus";

-- DropEnum
DROP TYPE "DVSubmissionStatus";

-- DropEnum
DROP TYPE "DvAssistanceType";

-- CreateTable
CREATE TABLE "DVPerson" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "type" "DVPersonType" NOT NULL,
    "detailsEncrypted" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DVApplicationFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DVApplicationFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "DVPerson_applicationId_idx" ON "DVPerson"("applicationId");

-- CreateIndex
CREATE INDEX "DVPerson_type_idx" ON "DVPerson"("type");

-- CreateIndex
CREATE INDEX "_DVApplicationFiles_B_index" ON "_DVApplicationFiles"("B");

-- CreateIndex
CREATE INDEX "DVApplication_userId_idx" ON "DVApplication"("userId");

-- CreateIndex
CREATE INDEX "DVApplication_providerId_idx" ON "DVApplication"("providerId");

-- CreateIndex
CREATE INDEX "DVApplication_status_idx" ON "DVApplication"("status");

-- CreateIndex
CREATE INDEX "DVApplication_isActive_idx" ON "DVApplication"("isActive");

-- CreateIndex
CREATE INDEX "DVDocument_applicationId_idx" ON "DVDocument"("applicationId");

-- CreateIndex
CREATE INDEX "DVDocument_personId_idx" ON "DVDocument"("personId");

-- CreateIndex
CREATE INDEX "DVDocument_type_idx" ON "DVDocument"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DVDocument_applicationId_fileId_key" ON "DVDocument"("applicationId", "fileId");

-- CreateIndex
CREATE INDEX "OrderItem_dvApplicationId_idx" ON "OrderItem"("dvApplicationId");

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dvApplicationId_fkey" FOREIGN KEY ("dvApplicationId") REFERENCES "DVApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplication" ADD CONSTRAINT "DVApplication_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplication" ADD CONSTRAINT "DVApplication_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplication" ADD CONSTRAINT "DVApplication_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVPerson" ADD CONSTRAINT "DVPerson_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVDocument" ADD CONSTRAINT "DVDocument_personId_fkey" FOREIGN KEY ("personId") REFERENCES "DVPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVDocument" ADD CONSTRAINT "DVDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVApplicationFiles" ADD CONSTRAINT "_DVApplicationFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DVApplicationFiles" ADD CONSTRAINT "_DVApplicationFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
