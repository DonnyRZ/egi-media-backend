-- Migration: 026_add_headline_sort_order
-- Curated ordering for homepage "Top Stories" (placement = headline).

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS headline_sort_order INTEGER NULL;

-- Backfill existing headline articles by newest publish date first.
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    ) AS rn
  FROM articles
  WHERE deleted_at IS NULL
    AND 'headline' = ANY (placements)
)
UPDATE articles AS a
SET headline_sort_order = ranked.rn
FROM ranked
WHERE a.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_articles_headline_sort_order
  ON articles (headline_sort_order ASC NULLS LAST)
  WHERE 'headline' = ANY (placements);
