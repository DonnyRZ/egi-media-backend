-- Migration: 009_add_youtube_translations
-- Adds optional English (en) and Uzbek (uz) translation columns to youtube_videos.
-- Indonesian (id) stays the primary language stored in the base columns
-- (title, description). Translation columns are nullable so a video can be
-- published in Indonesian first and translated later.
-- URL is shared across locales (same video asset).

ALTER TABLE youtube_videos
  ADD COLUMN IF NOT EXISTS title_en       varchar(255),
  ADD COLUMN IF NOT EXISTS description_en text,
  ADD COLUMN IF NOT EXISTS title_uz       varchar(255),
  ADD COLUMN IF NOT EXISTS description_uz text;
