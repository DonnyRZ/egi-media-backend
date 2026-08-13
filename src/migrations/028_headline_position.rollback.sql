-- Rollback: 028_headline_position

DROP INDEX IF EXISTS idx_articles_headline_position;

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_headline_position_check;

ALTER TABLE articles
  RENAME COLUMN headline_position TO headline_sort_order;

CREATE INDEX IF NOT EXISTS idx_articles_headline_sort_order
  ON articles (headline_sort_order ASC NULLS LAST)
  WHERE 'headline' = ANY (placements);
