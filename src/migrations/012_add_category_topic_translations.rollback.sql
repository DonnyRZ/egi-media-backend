-- Rollback: 012_add_category_topic_translations

DROP INDEX IF EXISTS idx_categories_slug_en;
DROP INDEX IF EXISTS idx_categories_slug_uz;
DROP INDEX IF EXISTS idx_topics_slug_en;
DROP INDEX IF EXISTS idx_topics_slug_uz;

ALTER TABLE categories
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS slug_en,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS name_uz,
  DROP COLUMN IF EXISTS slug_uz,
  DROP COLUMN IF EXISTS description_uz;

ALTER TABLE topics
  DROP COLUMN IF EXISTS name_en,
  DROP COLUMN IF EXISTS slug_en,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS name_uz,
  DROP COLUMN IF EXISTS slug_uz,
  DROP COLUMN IF EXISTS description_uz;
