/*
  Warnings:

  - Added the required column `orderWeight` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupDate` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalPieces` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "dropoffContactName" TEXT,
ADD COLUMN     "dropoffContactPhone" TEXT,
ADD COLUMN     "dropoffInstructions" TEXT,
ADD COLUMN     "orderWeight" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "pickupContactName" TEXT,
ADD COLUMN     "pickupContactPhone" TEXT,
ADD COLUMN     "pickupDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pickupInstructions" TEXT,
ADD COLUMN     "totalPieces" INTEGER NOT NULL,
ALTER COLUMN "pickupTime" SET DATA TYPE TEXT,
ALTER COLUMN "status" SET DEFAULT 'pending';
