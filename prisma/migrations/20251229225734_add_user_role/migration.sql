-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'COURIER');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER';
