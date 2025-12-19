ALTER TABLE products
ADD COLUMN IF NOT EXISTS slug TEXT;

-- isi slug untuk data lama (pakai id biar aman, nanti kamu bisa edit lagi)
UPDATE products
SET slug = COALESCE(slug, 'product-' || id)
WHERE slug IS NULL OR slug = '';

-- slug wajib unik
CREATE UNIQUE INDEX IF NOT EXISTS products_slug_uq ON products(slug);

-- slug wajib ada
ALTER TABLE products
ALTER COLUMN slug SET NOT NULL;
