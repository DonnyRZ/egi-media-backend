-- Async AI translation gate for publish/schedule.
CREATE TYPE article_translation_status AS ENUM (
  'none',
  'pending',
  'processing',
  'ready',
  'failed'
);

ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS translation_status article_translation_status NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_articles_translation_status
  ON articles (translation_status)
  WHERE deleted_at IS NULL;

-- Grandfather already-live published rows so the public site does not go blank
-- the moment this migration lands. New publish/schedule flows set pending/ready/failed.
UPDATE articles
SET translation_status = 'ready'
WHERE deleted_at IS NULL
  AND status = 'published'
  AND translation_status = 'none';

CREATE TYPE article_translation_job_status AS ENUM (
  'queued',
  'processing',
  'succeeded',
  'failed'
);

CREATE TABLE IF NOT EXISTS article_translation_jobs (
  id uuid PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES articles(id) DEFERRABLE,
  requested_by uuid REFERENCES users(id) DEFERRABLE,
  target_status varchar(20) NOT NULL,
  job_status article_translation_job_status NOT NULL DEFAULT 'queued',
  error_message text,
  bull_job_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_article_translation_jobs_requester_created
  ON article_translation_jobs (requested_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_translation_jobs_status_created
  ON article_translation_jobs (job_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_translation_jobs_article
  ON article_translation_jobs (article_id, created_at DESC);
