DROP INDEX IF EXISTS idx_articles_placements;

ALTER TABLE articles
  DROP COLUMN IF EXISTS placements;
