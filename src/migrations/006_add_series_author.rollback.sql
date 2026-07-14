-- Rollback: 006_add_series_author

DROP INDEX IF EXISTS idx_series_slug_unique;

DROP INDEX IF EXISTS idx_series_author_id;

ALTER TABLE series
  DROP CONSTRAINT IF EXISTS fk_series_author;

ALTER TABLE series
  DROP COLUMN IF EXISTS author_id;
