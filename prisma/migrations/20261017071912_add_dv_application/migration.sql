-- CreateEnum
CREATE TYPE "DvAssistanceType" AS ENUM ('VISA_APPLICATION', 'DOCUMENT_PREPARATION', 'CONSULTATION', 'TRANSLATION', 'COACHING', 'OTHER');

-- CreateEnum
CREATE TYPE "DVApplicationStatus" AS ENUM ('DRAFT', 'INFORMATION_REQUIRED', 'PREPARING', 'UNDER_REVIEW', 'AWAITING_APPLICANT_APPROVAL', 'READY_FOR_SUBMISSION', 'PAYMENT_PENDING', 'PAYMENT_VERIFIED', 'OFFICIAL_PAYMENT_PENDING', 'READY_FOR_REGISTRATION', 'SUBMITTED', 'CONFIRMED', 'RESULT_CHECK_ASSISTANCE', 'CANCELLED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DVGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "DVMaritalStatus" AS ENUM ('UNMARRIED', 'MARRIED', 'DIVORCED', 'WIDOWED', 'LEGALLY_SEPARATED');

-- CreateEnum
CREATE TYPE "DVEducationLevel" AS ENUM ('PRIMARY', 'SOME_SECONDARY', 'HIGH_SCHOOL_NO_DIPLOMA', 'HIGH_SCHOOL_DIPLOMA', 'VOCATIONAL', 'SOME_UNIVERSITY', 'UNIVERSITY_DEGREE', 'SOME_GRADUATE_STUDY', 'MASTERS_DEGREE', 'DOCTORATE', 'OTHER', 'NOT_PROVIDED');

-- CreateEnum
CREATE TYPE "DVFamilyRelationship" AS ENUM ('SPOUSE', 'CHILD');

-- CreateEnum
CREATE TYPE "DVDocumentType" AS ENUM ('APPLICANT_PHOTO', 'SPOUSE_PHOTO', 'CHILD_PHOTO', 'PASSPORT', 'OTHER');

-- CreateEnum
CREATE TYPE "DVDocumentStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'ACCEPTED_FOR_PREPARATION', 'NEEDS_REPLACEMENT');

-- CreateEnum
CREATE TYPE "DVReviewStatus" AS ENUM ('PASSED', 'NEEDS_CORRECTION', 'NEEDS_HUMAN_REVIEW');

-- CreateEnum
CREATE TYPE "DVOfficialPaymentStatus" AS ENUM ('UNKNOWN', 'NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "DVSubmissionStatus" AS ENUM ('PREPARED', 'AWAITING_APPLICANT', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'UNKNOWN');

-- AlterEnum
ALTER TYPE "OrderItemType" ADD VALUE 'DV_ASSISTANCE';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "dvAssistanceId" TEXT;

-- CreateTable
CREATE TABLE "DvAssistance" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" "DvAssistanceType" NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "thumbnailId" TEXT,
    "details" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DvAssistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dvYear" INTEGER NOT NULL,
    "status" "DVApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "orderId" TEXT,
    "serviceFee" DECIMAL(12,2) NOT NULL,
    "officialFeeAmount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "customerNotes" TEXT,
    "staffNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "DVApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVApplicantDetails" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "givenNameEnc" TEXT,
    "middleNameEnc" TEXT,
    "familyNameEnc" TEXT,
    "dateOfBirthEnc" TEXT,
    "gender" "DVGender",
    "cityOfBirthEnc" TEXT,
    "countryOfBirthEnc" TEXT,
    "countryOfEligibilityEnc" TEXT,
    "emailEnc" TEXT,
    "phoneEnc" TEXT,
    "addressEnc" TEXT,
    "cityEnc" TEXT,
    "regionEnc" TEXT,
    "postalCodeEnc" TEXT,
    "countryEnc" TEXT,
    "maritalStatus" "DVMaritalStatus",
    "educationLevel" "DVEducationLevel",
    "passportNumberEnc" TEXT,
    "passportCountryEnc" TEXT,
    "passportExpiryEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVApplicantDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVFamilyMember" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "relationship" "DVFamilyRelationship" NOT NULL,
    "givenNameEnc" TEXT,
    "middleNameEnc" TEXT,
    "familyNameEnc" TEXT,
    "dateOfBirthEnc" TEXT,
    "gender" "DVGender",
    "cityOfBirthEnc" TEXT,
    "countryOfBirthEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVFamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVDocument" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "familyMemberId" TEXT,
    "fileId" TEXT NOT NULL,
    "type" "DVDocumentType" NOT NULL,
    "status" "DVDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "reviewNotesEnc" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVApplicationReview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "status" "DVReviewStatus" NOT NULL,
    "notesEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DVApplicationReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVSubmissionRecord" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "DVSubmissionStatus" NOT NULL DEFAULT 'PREPARED',
    "confirmationNumberEnc" TEXT,
    "submittedAt" TIMESTAMP(3),
    "confirmedAt" TIMESTAMP(3),
    "handledByUserId" TEXT,
    "notesEnc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVSubmissionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DVOfficialPayment" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "DVOfficialPaymentStatus" NOT NULL DEFAULT 'UNKNOWN',
    "amount" DECIMAL(12,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT,
    "transactionRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReasonEnc" TEXT,
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVOfficialPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_DvAssistanceFiles" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_DvAssistanceFiles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "DvAssistance_slug_key" ON "DvAssistance"("slug");

-- CreateIndex
CREATE INDEX "DvAssistance_providerId_idx" ON "DvAssistance"("providerId");

-- CreateIndex
CREATE INDEX "DvAssistance_type_idx" ON "DvAssistance"("type");

-- CreateIndex
CREATE INDEX "DvAssistance_isActive_idx" ON "DvAssistance"("isActive");

-- CreateIndex
CREATE INDEX "DvAssistance_createdAt_idx" ON "DvAssistance"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DVApplication_orderId_key" ON "DVApplication"("orderId");

-- CreateIndex
CREATE INDEX "DVApplication_userId_status_idx" ON "DVApplication"("userId", "status");

-- CreateIndex
CREATE INDEX "DVApplication_dvYear_idx" ON "DVApplication"("dvYear");

-- CreateIndex
CREATE INDEX "DVApplication_createdAt_idx" ON "DVApplication"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "DVApplicantDetails_applicationId_key" ON "DVApplicantDetails"("applicationId");

-- CreateIndex
CREATE INDEX "DVFamilyMember_applicationId_idx" ON "DVFamilyMember"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "DVDocument_fileId_key" ON "DVDocument"("fileId");

-- CreateIndex
CREATE INDEX "DVDocument_applicationId_status_idx" ON "DVDocument"("applicationId", "status");

-- CreateIndex
CREATE INDEX "DVDocument_familyMemberId_idx" ON "DVDocument"("familyMemberId");

-- CreateIndex
CREATE INDEX "DVApplicationReview_applicationId_createdAt_idx" ON "DVApplicationReview"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "DVApplicationReview_reviewerId_idx" ON "DVApplicationReview"("reviewerId");

-- CreateIndex
CREATE INDEX "DVSubmissionRecord_applicationId_createdAt_idx" ON "DVSubmissionRecord"("applicationId", "createdAt");

-- CreateIndex
CREATE INDEX "DVSubmissionRecord_status_idx" ON "DVSubmissionRecord"("status");

-- CreateIndex
CREATE INDEX "DVOfficialPayment_applicationId_status_idx" ON "DVOfficialPayment"("applicationId", "status");

-- CreateIndex
CREATE INDEX "_DvAssistanceFiles_B_index" ON "_DvAssistanceFiles"("B");

-- CreateIndex
CREATE INDEX "OrderItem_dvAssistanceId_idx" ON "OrderItem"("dvAssistanceId");

-- AddForeignKey
ALTER TABLE "DvAssistance" ADD CONSTRAINT "DvAssistance_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DvAssistance" ADD CONSTRAINT "DvAssistance_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_dvAssistanceId_fkey" FOREIGN KEY ("dvAssistanceId") REFERENCES "DvAssistance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplication" ADD CONSTRAINT "DVApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicantDetails" ADD CONSTRAINT "DVApplicantDetails_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVFamilyMember" ADD CONSTRAINT "DVFamilyMember_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVDocument" ADD CONSTRAINT "DVDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVDocument" ADD CONSTRAINT "DVDocument_familyMemberId_fkey" FOREIGN KEY ("familyMemberId") REFERENCES "DVFamilyMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVDocument" ADD CONSTRAINT "DVDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicationReview" ADD CONSTRAINT "DVApplicationReview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicationReview" ADD CONSTRAINT "DVApplicationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVSubmissionRecord" ADD CONSTRAINT "DVSubmissionRecord_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVSubmissionRecord" ADD CONSTRAINT "DVSubmissionRecord_handledByUserId_fkey" FOREIGN KEY ("handledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVOfficialPayment" ADD CONSTRAINT "DVOfficialPayment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "DVApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVOfficialPayment" ADD CONSTRAINT "DVOfficialPayment_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DvAssistanceFiles" ADD CONSTRAINT "_DvAssistanceFiles_A_fkey" FOREIGN KEY ("A") REFERENCES "DvAssistance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DvAssistanceFiles" ADD CONSTRAINT "_DvAssistanceFiles_B_fkey" FOREIGN KEY ("B") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
