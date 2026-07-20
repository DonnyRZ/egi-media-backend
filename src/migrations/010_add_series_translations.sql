-- Migration: 010_add_series_translations
-- Adds optional English (en) and Uzbek (uz) translation columns to series.
-- Indonesian (id) stays the primary language stored in the base columns
-- (name, slug, description). Translation columns are nullable so a series can
-- be published in Indonesian first and translated later.

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS name_en        varchar(150),
  ADD COLUMN IF NOT EXISTS slug_en        varchar(150),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS name_uz        varchar(150),
  ADD COLUMN IF NOT EXISTS slug_uz        varchar(150),
  ADD COLUMN IF NOT EXISTS description_uz text;

-- Indexes to support localized slug lookups (non-unique; base slug stays unique).
CREATE INDEX IF NOT EXISTS idx_series_slug_en
  ON series (slug_en)
  WHERE slug_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_series_slug_uz
  ON series (slug_uz)
  WHERE slug_uz IS NOT NULL;
