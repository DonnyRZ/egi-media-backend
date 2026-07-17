-- Rollback: 009_add_youtube_translations

ALTER TABLE youtube_videos
  DROP COLUMN IF EXISTS title_en,
  DROP COLUMN IF EXISTS description_en,
  DROP COLUMN IF EXISTS title_uz,
  DROP COLUMN IF EXISTS description_uz;
