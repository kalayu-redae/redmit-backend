-- CreateTable
CREATE TABLE "DigitalProduct" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DigitalProduct_slug_key" ON "DigitalProduct"("slug");

-- CreateIndex
CREATE INDEX "DigitalProduct_sellerId_idx" ON "DigitalProduct"("sellerId");

-- CreateIndex
CREATE INDEX "DigitalProduct_categoryId_idx" ON "DigitalProduct"("categoryId");

-- CreateIndex
CREATE INDEX "DigitalProduct_isActive_idx" ON "DigitalProduct"("isActive");

-- CreateIndex
CREATE INDEX "DigitalProduct_createdAt_idx" ON "DigitalProduct"("createdAt");

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalProduct" ADD CONSTRAINT "DigitalProduct_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
