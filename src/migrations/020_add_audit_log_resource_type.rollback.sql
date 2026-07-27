-- Rollback: 020_add_audit_log_resource_type

DROP INDEX IF EXISTS idx_audit_logs_resource_type;

ALTER TABLE audit_logs
  DROP COLUMN IF EXISTS resource_type;
