-- Migration: 012_add_category_topic_translations
-- Adds optional English (en) and Uzbek (uz) translation columns to categories
-- and topics. Indonesian (id) stays in the base columns (name, slug, description).
-- Translation columns are nullable so records can be published in Indonesian first.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS name_en        varchar(100),
  ADD COLUMN IF NOT EXISTS slug_en        varchar(120),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS name_uz        varchar(100),
  ADD COLUMN IF NOT EXISTS slug_uz        varchar(120),
  ADD COLUMN IF NOT EXISTS description_uz text;

ALTER TABLE topics
  ADD COLUMN IF NOT EXISTS name_en        varchar(100),
  ADD COLUMN IF NOT EXISTS slug_en        varchar(120),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS name_uz        varchar(100),
  ADD COLUMN IF NOT EXISTS slug_uz        varchar(120),
  ADD COLUMN IF NOT EXISTS description_uz text;

CREATE INDEX IF NOT EXISTS idx_categories_slug_en
  ON categories (slug_en)
  WHERE slug_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_slug_uz
  ON categories (slug_uz)
  WHERE slug_uz IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_topics_slug_en
  ON topics (slug_en)
  WHERE slug_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_topics_slug_uz
  ON topics (slug_uz)
  WHERE slug_uz IS NOT NULL;
