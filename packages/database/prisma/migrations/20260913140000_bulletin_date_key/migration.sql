-- AlterTable
ALTER TABLE "daily_price_bulletins" ADD COLUMN IF NOT EXISTS "date_key" TEXT;

-- Update existing rows from date or created_at
UPDATE "daily_price_bulletins"
SET "date_key" = to_char("date", 'YYYY-MM-DD')
WHERE "date_key" IS NULL OR "date_key" = '';

-- AlterColumn to NOT NULL
ALTER TABLE "daily_price_bulletins" ALTER COLUMN "date_key" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "daily_price_bulletins_date_key_key" ON "daily_price_bulletins"("date_key");
