-- Rollback: 011_add_series_image

ALTER TABLE series
  DROP COLUMN IF EXISTS image;
