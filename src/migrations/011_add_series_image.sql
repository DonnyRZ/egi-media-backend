-- Migration: 011_add_series_image
-- Adds a single shared image column to series.
-- Image is locale-independent: the same asset is used for id/en/uz.

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS image text;
