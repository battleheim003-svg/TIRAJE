-- AlterTable
ALTER TABLE "brands" ADD COLUMN "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "posts" ADD COLUMN "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "products" ADD COLUMN "archived_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "users" ADD COLUMN "archived_at" TIMESTAMP(3);
