-- Create the enum type
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'EN_ROUTE_PICKUP', 'PICKED_UP', 'DELIVERED');

-- === Migrate Order table (preserve data) ===
ALTER TABLE "Order" ADD COLUMN "new_status" "OrderStatus";

UPDATE "Order" 
SET "new_status" = CASE
  WHEN status = 'pending' THEN 'PENDING'
  WHEN status = 'en_route_pickup' THEN 'EN_ROUTE_PICKUP'
  WHEN status = 'picked_up' THEN 'PICKED_UP'
  WHEN status = 'delivered' THEN 'DELIVERED'
  ELSE 'PENDING'  -- fallback for any unexpected value
END::"OrderStatus";

ALTER TABLE "Order" DROP COLUMN "status";
ALTER TABLE "Order" RENAME COLUMN "new_status" TO "status";
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Order" ALTER COLUMN "status" SET NOT NULL;

-- === Migrate OrderHistory table (preserve data) ===
ALTER TABLE "OrderHistory" ADD COLUMN "new_status" "OrderStatus";

UPDATE "OrderHistory" 
SET "new_status" = CASE
  WHEN status = 'pending' THEN 'PENDING'
  WHEN status = 'en_route_pickup' THEN 'EN_ROUTE_PICKUP'
  WHEN status = 'picked_up' THEN 'PICKED_UP'
  WHEN status = 'delivered' THEN 'DELIVERED'
  ELSE 'PENDING'
END::"OrderStatus";

ALTER TABLE "OrderHistory" DROP COLUMN "status";
ALTER TABLE "OrderHistory" RENAME COLUMN "new_status" TO "status";
ALTER TABLE "OrderHistory" ALTER COLUMN "status" SET NOT NULL;

-- === Add changedBy relation ===
ALTER TABLE "OrderHistory" ADD COLUMN "changedById" INTEGER;

ALTER TABLE "OrderHistory" ADD CONSTRAINT "OrderHistory_changedById_fkey" 
  FOREIGN KEY ("changedById") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;