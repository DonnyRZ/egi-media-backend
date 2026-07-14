-- Migration: 006_add_series_author
-- Adds Series ownership for the owner author / superadmin rule.

ALTER TABLE series
  ADD COLUMN author_id uuid NOT NULL;

ALTER TABLE series
  ADD CONSTRAINT fk_series_author
  FOREIGN KEY (author_id)
  REFERENCES users (id);

CREATE INDEX IF NOT EXISTS idx_series_author_id
  ON series (author_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_series_slug_unique
  ON series (slug);
