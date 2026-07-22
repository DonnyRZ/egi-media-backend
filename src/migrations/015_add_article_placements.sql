-- Article placements: where a published article appears on the public site.
-- Independent of lifecycle status (draft/review/published/etc.).
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS placements TEXT[] NOT NULL DEFAULT ARRAY['latest_news']::TEXT[];

-- Backfill any rows that somehow lack the default (safety for older PG paths).
UPDATE articles
SET placements = ARRAY['latest_news']::TEXT[]
WHERE placements IS NULL OR cardinality(placements) = 0;

CREATE INDEX IF NOT EXISTS idx_articles_placements
  ON articles USING GIN (placements);
