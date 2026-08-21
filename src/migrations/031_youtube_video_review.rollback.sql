DROP INDEX IF EXISTS idx_youtube_videos_status;
DROP INDEX IF EXISTS idx_youtube_videos_author_id;

ALTER TABLE youtube_videos
  DROP CONSTRAINT IF EXISTS youtube_videos_status_check;

ALTER TABLE youtube_videos
  DROP COLUMN IF EXISTS status;

ALTER TABLE youtube_videos
  DROP COLUMN IF EXISTS author_id;
