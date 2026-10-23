-- CreateEnum
CREATE TYPE "DVDocumentType" AS ENUM ('APPLICANT_PHOTO', 'SPOUSE_PHOTO', 'CHILD_PHOTO', 'PASSPORT', 'SUPPORTING_DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "DVApplicationDocument" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "fileId" TEXT NOT NULL,
    "documentType" "DVDocumentType" NOT NULL,
    "subjectType" TEXT,
    "subjectIndex" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DVApplicationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DVApplicationDocument_requestId_idx" ON "DVApplicationDocument"("requestId");

-- CreateIndex
CREATE INDEX "DVApplicationDocument_fileId_idx" ON "DVApplicationDocument"("fileId");

-- CreateIndex
CREATE INDEX "DVApplicationDocument_documentType_idx" ON "DVApplicationDocument"("documentType");

-- CreateIndex
CREATE UNIQUE INDEX "DVApplicationDocument_requestId_fileId_key" ON "DVApplicationDocument"("requestId", "fileId");

-- AddForeignKey
ALTER TABLE "DVApplicationDocument" ADD CONSTRAINT "DVApplicationDocument_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "DVApplicationRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DVApplicationDocument" ADD CONSTRAINT "DVApplicationDocument_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
