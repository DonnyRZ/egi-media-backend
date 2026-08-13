-- Rollback: 026_add_headline_sort_order

DROP INDEX IF EXISTS idx_articles_headline_sort_order;

ALTER TABLE articles
  DROP COLUMN IF EXISTS headline_sort_order;
