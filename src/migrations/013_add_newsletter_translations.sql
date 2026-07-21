-- Migration: 013_add_newsletter_translations
-- Adds optional English (en) and Uzbek (uz) translation columns to newsletters.
-- Indonesian (id) stays the primary language stored in the base columns
-- (name, description). Translation columns are nullable so a newsletter can be
-- created in Indonesian first and translated later.
-- frequency and is_active are shared across locales.

ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS name_en        varchar(150),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS name_uz        varchar(150),
  ADD COLUMN IF NOT EXISTS description_uz text;
