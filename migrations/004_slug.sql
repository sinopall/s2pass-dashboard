ALTER TABLE products
  ADD COLUMN IF NOT EXISTS slug TEXT;

UPDATE products
SET slug = LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9\\s-]', '', 'g'));

UPDATE products
SET slug = REGEXP_REPLACE(slug, '\\s+', '-', 'g');

UPDATE products
SET slug = REGEXP_REPLACE(slug, '-+', '-', 'g');

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uq ON products(slug);

ALTER TABLE products
  ALTER COLUMN slug SET NOT NULL;
