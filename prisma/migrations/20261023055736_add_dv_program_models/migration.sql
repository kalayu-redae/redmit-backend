-- AlterEnum
ALTER TYPE "DVDocumentType" ADD VALUE 'INTERNATIONAL_PAYMENT_CONFIRMATION';

-- AlterTable
ALTER TABLE "DVApplicationRequest" ADD COLUMN     "dvProgramId" TEXT,
ADD COLUMN     "paymentConfirmation" JSONB,
ADD COLUMN     "paymentConfirmedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "DVProgram" (
    "id" TEXT NOT NULL,
    "thumbnailId" TEXT,
    "dvYear" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "acceptingRequests" BOOLEAN NOT NULL DEFAULT false,
    "paymentAssistanceFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "formFillingFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "internationalPaymentFee" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DVProgram_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DVProgram_dvYear_key" ON "DVProgram"("dvYear");

-- CreateIndex
CREATE INDEX "DVProgram_isActive_acceptingRequests_idx" ON "DVProgram"("isActive", "acceptingRequests");

-- CreateIndex
CREATE INDEX "DVProgram_startDate_endDate_idx" ON "DVProgram"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "DVApplicationRequest_dvProgramId_idx" ON "DVApplicationRequest"("dvProgramId");

-- AddForeignKey
ALTER TABLE "DVProgram" ADD CONSTRAINT "DVProgram_thumbnailId_fkey" FOREIGN KEY ("thumbnailId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicationRequest" ADD CONSTRAINT "DVApplicationRequest_dvProgramId_fkey" FOREIGN KEY ("dvProgramId") REFERENCES "DVProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE;
