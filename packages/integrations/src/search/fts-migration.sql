-- PostgreSQL Full-Text Search setup for Tirajeh
-- Run this AFTER prisma migrate deploy via: psql $DATABASE_URL -f fts-migration.sql
-- Or add as a raw SQL file in prisma/migrations/manual_fts/migration.sql

-- ── 1. Enable pg_trgm for Persian trigram search ─────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ── 2. Add tsvector columns to products ───────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Populate from existing rows
UPDATE products
SET search_vector =
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(name_en, ''))
  || to_tsvector('simple', coalesce(description, ''))
  || to_tsvector('simple', coalesce(sku, ''))
  || to_tsvector('simple', coalesce(cement_type, ''))
  || to_tsvector('simple', coalesce(standard_code, ''));

-- GIN index — fast full-text queries
CREATE INDEX IF NOT EXISTS idx_products_search_vector
  ON products USING GIN (search_vector);

-- pg_trgm index — Persian substring / trigram fallback
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_products_name_en_trgm
  ON products USING GIN (name_en gin_trgm_ops);

-- ── 3. Trigger: keep search_vector current on INSERT / UPDATE ─────────────────
CREATE OR REPLACE FUNCTION products_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple',
      coalesce(NEW.name, '') || ' ' ||
      coalesce(NEW.name_en, '') || ' ' ||
      coalesce(NEW.description, '') || ' ' ||
      coalesce(NEW.sku, '') || ' ' ||
      coalesce(NEW.cement_type, '') || ' ' ||
      coalesce(NEW.standard_code, '')
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_search_vector_trigger ON products;
CREATE TRIGGER products_search_vector_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION products_search_vector_update();

-- ── 4. Add tsvector columns to posts ─────────────────────────────────────────
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE posts
SET search_vector =
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(title_en, ''))
  || to_tsvector('simple', coalesce(excerpt, '') || ' ' || coalesce(excerpt_en, ''));

CREATE INDEX IF NOT EXISTS idx_posts_search_vector
  ON posts USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS idx_posts_title_trgm
  ON posts USING GIN (title gin_trgm_ops);

CREATE OR REPLACE FUNCTION posts_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('simple',
      coalesce(NEW.title, '') || ' ' ||
      coalesce(NEW.title_en, '') || ' ' ||
      coalesce(NEW.excerpt, '') || ' ' ||
      coalesce(NEW.excerpt_en, '')
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS posts_search_vector_trigger ON posts;
CREATE TRIGGER posts_search_vector_trigger
  BEFORE INSERT OR UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION posts_search_vector_update();
