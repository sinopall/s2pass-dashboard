-- 002_products.sql

CREATE TABLE IF NOT EXISTS products (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- basic indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_breaking ON products(is_breaking);
CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);

-- optional: full-text search (simple)
-- CREATE INDEX IF NOT EXISTS idx_products_title_tsv ON products USING GIN (to_tsvector('simple', title));
