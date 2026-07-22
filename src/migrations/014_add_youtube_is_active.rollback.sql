DROP INDEX IF EXISTS idx_youtube_videos_is_active;

ALTER TABLE youtube_videos
  DROP COLUMN IF EXISTS is_active;
