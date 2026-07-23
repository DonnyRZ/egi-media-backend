-- Add a dedicated article_title column for newsroom-readable audit trails.
-- Also widen ip_address so proxy chains do not silently break inserts.

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS article_title varchar(255);

ALTER TABLE audit_logs
  ALTER COLUMN ip_address TYPE varchar(255);

-- Backfill titles from existing JSON payloads where present.
UPDATE audit_logs
SET article_title = COALESCE(
  article_title,
  NULLIF(new_data->>'article_title', ''),
  NULLIF(new_data->>'title', ''),
  NULLIF(old_data->>'article_title', ''),
  NULLIF(old_data->>'title', '')
)
WHERE article_title IS NULL;
