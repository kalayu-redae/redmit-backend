-- AlterTable
ALTER TABLE "User" ADD COLUMN     "passwordResetOTP" TEXT,
ADD COLUMN     "passwordResetOTPExpires" TIMESTAMP(3);
