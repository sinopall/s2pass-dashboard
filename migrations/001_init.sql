-- Enable extensions if needed (optional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS
CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('admin','agent')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower
ON users (lower(username));

-- CATEGORIES (Adjacency list)
CREATE TABLE IF NOT EXISTS categories (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  parent_id  BIGINT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  level      INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unik untuk root (parent_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_root_name_lower
ON categories (lower(name))
WHERE parent_id IS NULL;

-- Unik untuk non-root: (parent_id, lower(name))
CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_parent_name_lower
ON categories (parent_id, lower(name))
WHERE parent_id IS NOT NULL;

-- Seed admin (username: admin, password: admin1234)
-- bcrypt hash (12 rounds)
INSERT INTO users (username, password_hash, role)
VALUES ('admin', '$2b$12$ODZuSy07obkh0tN3ZdOPN.u387/8NGvDeBssA26ciJoElM9p9sEcu', 'admin')
ON CONFLICT DO NOTHING;

-- Seed root categories (level=0)
INSERT INTO categories (name, parent_id, level) VALUES
  ('Informasi', NULL, 0),
  ('Request',   NULL, 0),
  ('Complaint', NULL, 0)
ON CONFLICT DO NOTHING;

-- updated_at trigger (simple approach: update from app; MVP skip trigger)
