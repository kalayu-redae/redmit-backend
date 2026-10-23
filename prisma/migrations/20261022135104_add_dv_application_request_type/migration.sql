/*
  Warnings:

  - The values [DV_ASSISTANCE] on the enum `OrderItemType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrderItemType_new" AS ENUM ('DIGITAL_PRODUCT', 'DIGITAL_ASSET', 'DIGITAL_ACCESS', 'DIGITAL_GROWTH', 'DV_APPLICATION_REQUEST');
ALTER TABLE "OrderItem" ALTER COLUMN "type" TYPE "OrderItemType_new" USING ("type"::text::"OrderItemType_new");
ALTER TYPE "OrderItemType" RENAME TO "OrderItemType_old";
ALTER TYPE "OrderItemType_new" RENAME TO "OrderItemType";
DROP TYPE "public"."OrderItemType_old";
COMMIT;
