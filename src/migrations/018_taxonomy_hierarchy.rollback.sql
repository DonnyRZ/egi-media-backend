-- Rollback: 018_taxonomy_hierarchy

DROP INDEX IF EXISTS idx_series_topic_id;
DROP INDEX IF EXISTS idx_topics_category_id;

ALTER TABLE series DROP CONSTRAINT IF EXISTS series_topic_id_fkey;
ALTER TABLE topics DROP CONSTRAINT IF EXISTS topics_category_id_fkey;

ALTER TABLE series DROP COLUMN IF EXISTS topic_id;
ALTER TABLE topics DROP COLUMN IF EXISTS category_id;
