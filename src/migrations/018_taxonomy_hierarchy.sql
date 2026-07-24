-- Migration: 018_taxonomy_hierarchy
-- Category → Topic → Series: topics.category_id, series.topic_id

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS category_id uuid;

ALTER TABLE series
  ADD COLUMN IF NOT EXISTS topic_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_category_id_fkey'
  ) THEN
    ALTER TABLE topics
      ADD CONSTRAINT topics_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'series_topic_id_fkey'
  ) THEN
    ALTER TABLE series
      ADD CONSTRAINT series_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES topics (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics (category_id);
CREATE INDEX IF NOT EXISTS idx_series_topic_id ON series (topic_id);

-- Backfill topic → primary category from published article usage
UPDATE topics t
SET category_id = mapped.category_id
FROM (
  SELECT ranked.topic_id, ranked.category_id
  FROM (
    SELECT
      at2.topic_id,
      a.category_id,
      ROW_NUMBER() OVER (
        PARTITION BY at2.topic_id
        ORDER BY COUNT(*) DESC, a.category_id ASC
      ) AS rn
    FROM article_topics at2
    INNER JOIN articles a ON a.id = at2.article_id
    WHERE a.deleted_at IS NULL
      AND a.status = 'published'
      AND a.category_id IS NOT NULL
    GROUP BY at2.topic_id, a.category_id
  ) ranked
  WHERE ranked.rn = 1
) mapped
WHERE t.id = mapped.topic_id
  AND t.category_id IS NULL;

-- Backfill series → primary topic from article_topics on series articles
UPDATE series s
SET topic_id = mapped.topic_id
FROM (
  SELECT ranked.series_id, ranked.topic_id
  FROM (
    SELECT
      a.series_id,
      at2.topic_id,
      ROW_NUMBER() OVER (
        PARTITION BY a.series_id
        ORDER BY COUNT(*) DESC, at2.topic_id ASC
      ) AS rn
    FROM articles a
    INNER JOIN article_topics at2 ON at2.article_id = a.id
    WHERE a.deleted_at IS NULL
      AND a.series_id IS NOT NULL
    GROUP BY a.series_id, at2.topic_id
  ) ranked
  WHERE ranked.rn = 1
) mapped
WHERE s.id = mapped.series_id
  AND s.topic_id IS NULL;
