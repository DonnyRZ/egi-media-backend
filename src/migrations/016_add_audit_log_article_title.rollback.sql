-- Rollback: remove article_title and restore ip_address width.

ALTER TABLE audit_logs
  DROP COLUMN IF EXISTS article_title;

ALTER TABLE audit_logs
  ALTER COLUMN ip_address TYPE varchar(64);
