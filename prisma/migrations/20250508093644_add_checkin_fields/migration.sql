-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmergencyActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextCheckinTime" TIMESTAMP(3);
