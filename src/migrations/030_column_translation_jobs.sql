-- Async AI translation gate for column approve/publish.
-- Reuses article_translation_status (none|pending|processing|ready|failed).

ALTER TABLE "columns"
  ADD COLUMN IF NOT EXISTS translation_status article_translation_status NOT NULL DEFAULT 'none';

CREATE INDEX IF NOT EXISTS idx_columns_translation_status
  ON "columns" (translation_status)
  WHERE deleted_at IS NULL;

-- Published columns that already have complete EN/UZ skip the backfill queue.
UPDATE "columns"
SET translation_status = 'ready'
WHERE deleted_at IS NULL
  AND status = 'published'
  AND translation_status = 'none'
  AND COALESCE(TRIM(title_en), '') <> ''
  AND COALESCE(TRIM(content_en), '') <> ''
  AND COALESCE(TRIM(title_uz), '') <> ''
  AND COALESCE(TRIM(content_uz), '') <> ''
  AND (
    COALESCE(TRIM(summary), '') = ''
    OR (
      COALESCE(TRIM(summary_en), '') <> ''
      AND COALESCE(TRIM(summary_uz), '') <> ''
    )
  );

CREATE TABLE IF NOT EXISTS column_translation_jobs (
  id uuid PRIMARY KEY,
  column_id uuid NOT NULL REFERENCES "columns"(id) DEFERRABLE,
  requested_by uuid REFERENCES users(id) DEFERRABLE,
  target_status varchar(20) NOT NULL DEFAULT 'published',
  job_status article_translation_job_status NOT NULL DEFAULT 'queued',
  error_message text,
  bull_job_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_column_translation_jobs_requester_created
  ON column_translation_jobs (requested_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_column_translation_jobs_status_created
  ON column_translation_jobs (job_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_column_translation_jobs_column
  ON column_translation_jobs (column_id, created_at DESC);
