-- Migration: 020_add_audit_log_resource_type
-- Human-readable resource type for CMS audit logs (Article, Column, Video, …).

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS resource_type varchar(50);

UPDATE audit_logs
SET resource_type = CASE lower(coalesce(table_name, ''))
  WHEN 'articles' THEN 'Article'
  WHEN 'columns' THEN 'Column'
  WHEN 'youtube_videos' THEN 'Video'
  WHEN 'categories' THEN 'Category'
  WHEN 'topics' THEN 'Topic'
  WHEN 'series' THEN 'Series'
  WHEN 'tags' THEN 'Tag'
  WHEN 'users' THEN 'User'
  WHEN 'newsletters' THEN 'Newsletter'
  WHEN '' THEN 'Unknown'
  ELSE initcap(replace(table_name, '_', ' '))
END
WHERE resource_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type
  ON audit_logs (resource_type);
