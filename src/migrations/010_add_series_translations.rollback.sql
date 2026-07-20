-- Rollback: 010_add_series_translations

DROP INDEX IF EXISTS idx_series_slug_en;
DROP INDEX IF EXISTS idx_series_slug_uz;

ALTER TABLE series
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS slug_en,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS name_uz,
  DROP COLUMN IF EXISTS slug_uz,
  DROP COLUMN IF EXISTS description_uz;
