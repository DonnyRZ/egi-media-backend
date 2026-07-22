-- Active/inactive flag for featured YouTube videos (CMS + public listing).
ALTER TABLE youtube_videos
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_youtube_videos_is_active
  ON youtube_videos (is_active);
