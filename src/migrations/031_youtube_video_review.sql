-- Ownership + editorial review status for featured YouTube videos.
ALTER TABLE youtube_videos
  ADD COLUMN IF NOT EXISTS author_id uuid REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE youtube_videos
  ADD COLUMN IF NOT EXISTS status varchar(20) NOT NULL DEFAULT 'published';

UPDATE youtube_videos
SET status = CASE WHEN is_active THEN 'published' ELSE 'review' END;

ALTER TABLE youtube_videos
  DROP CONSTRAINT IF EXISTS youtube_videos_status_check;

ALTER TABLE youtube_videos
  ADD CONSTRAINT youtube_videos_status_check
  CHECK (status IN ('review', 'published'));

CREATE INDEX IF NOT EXISTS idx_youtube_videos_author_id
  ON youtube_videos (author_id);

CREATE INDEX IF NOT EXISTS idx_youtube_videos_status
  ON youtube_videos (status);
