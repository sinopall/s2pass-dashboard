-- 006_product_status.sql

ALTER TABLE products
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Index untuk mempercepat filter produk aktif (dipakai saat agent browsing/search)
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);