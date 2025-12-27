-- 005_scripts.sql

CREATE TABLE IF NOT EXISTS scripts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Basic Indexes
-- Index untuk mempercepat filter by Category
CREATE INDEX IF NOT EXISTS idx_scripts_category_id ON scripts(category_id);

-- Index untuk filter Breaking/Highlight (jika nanti dipakai)
CREATE INDEX IF NOT EXISTS idx_scripts_breaking ON scripts(is_breaking);

-- Index untuk pencarian judul
CREATE INDEX IF NOT EXISTS idx_scripts_title ON scripts(title);

-- Unique Index untuk Slug (agar URL SEO friendly dan tidak duplikat)
CREATE UNIQUE INDEX IF NOT EXISTS scripts_slug_uq ON scripts(slug);