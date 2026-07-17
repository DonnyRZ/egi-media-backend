-- Migration: 008_add_article_translations
-- Adds optional English (en) and Uzbek (uz) translation columns to articles.
-- Indonesian (id) stays the primary language stored in the base columns
-- (title, slug, summary, content). Translation columns are nullable so an
-- article can be published in Indonesian first and translated later.

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS title_en   varchar(255),
  ADD COLUMN IF NOT EXISTS slug_en    varchar(255),
  ADD COLUMN IF NOT EXISTS summary_en text,
  ADD COLUMN IF NOT EXISTS content_en text,
  ADD COLUMN IF NOT EXISTS title_uz   varchar(255),
  ADD COLUMN IF NOT EXISTS slug_uz    varchar(255),
  ADD COLUMN IF NOT EXISTS summary_uz text,
  ADD COLUMN IF NOT EXISTS content_uz text;

-- Indexes to support localized slug lookups (non-unique, matching idx_articles_slug).
CREATE INDEX IF NOT EXISTS idx_articles_slug_en
  ON articles (slug_en)
  WHERE deleted_at IS NULL AND slug_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_articles_slug_uz
  ON articles (slug_uz)
  WHERE deleted_at IS NULL AND slug_uz IS NOT NULL;
