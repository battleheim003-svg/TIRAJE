-- DropIndex
DROP INDEX IF EXISTS "cart_items_session_id_product_id_key";

-- DropIndex
DROP INDEX IF EXISTS "cart_items_user_id_product_id_key";

-- AlterTable
ALTER TABLE "cart_items" ADD COLUMN     "packaging_tier" "PackagingTier";

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "packaging_tier" "PackagingTier",
ADD COLUMN     "product_name_fa" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "weight_kg" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_product_id_packaging_tier_key" ON "cart_items"("user_id", "product_id", "packaging_tier");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_session_id_product_id_packaging_tier_key" ON "cart_items"("session_id", "product_id", "packaging_tier");

