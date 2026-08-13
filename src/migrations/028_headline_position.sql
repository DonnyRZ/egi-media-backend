-- Migration: 028_headline_position
-- Replace free-form headline_sort_order with curated headline_position (1-5).

ALTER TABLE articles
  RENAME COLUMN headline_sort_order TO headline_position;

-- Cap existing ranks to the Top Stories window (1-5).
UPDATE articles
SET headline_position = NULL,
    placements = array_remove(placements, 'headline')
WHERE headline_position IS NOT NULL
  AND (headline_position < 1 OR headline_position > 5);

-- Keep at most one article per position (prefer newest published).
WITH ranked AS (
  SELECT
    id,
    headline_position,
    ROW_NUMBER() OVER (
      PARTITION BY headline_position
      ORDER BY published_at DESC NULLS LAST, created_at DESC
    ) AS rn
  FROM articles
  WHERE deleted_at IS NULL
    AND headline_position IS NOT NULL
)
UPDATE articles AS a
SET headline_position = NULL,
    placements = array_remove(a.placements, 'headline')
FROM ranked
WHERE a.id = ranked.id
  AND ranked.rn > 1;

ALTER TABLE articles DROP CONSTRAINT IF EXISTS articles_headline_position_check;
ALTER TABLE articles
  ADD CONSTRAINT articles_headline_position_check
  CHECK (
    headline_position IS NULL
    OR (headline_position >= 1 AND headline_position <= 5)
  );

DROP INDEX IF EXISTS idx_articles_headline_sort_order;

CREATE INDEX IF NOT EXISTS idx_articles_headline_position
  ON articles (headline_position ASC NULLS LAST)
  WHERE deleted_at IS NULL
    AND headline_position IS NOT NULL;

