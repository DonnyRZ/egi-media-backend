-- Rollback: 008_add_article_translations

DROP INDEX IF EXISTS idx_articles_slug_en;
DROP INDEX IF EXISTS idx_articles_slug_uz;

ALTER TABLE articles
  DROP COLUMN IF EXISTS title_en,
  DROP COLUMN IF EXISTS slug_en,
  DROP COLUMN IF EXISTS summary_en,
  DROP COLUMN IF EXISTS content_en,
  DROP COLUMN IF EXISTS title_uz,
  DROP COLUMN IF EXISTS slug_uz,
  DROP COLUMN IF EXISTS summary_uz,
  DROP COLUMN IF EXISTS content_uz;
