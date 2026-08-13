DROP INDEX IF EXISTS idx_column_translation_jobs_column;
DROP INDEX IF EXISTS idx_column_translation_jobs_status_created;
DROP INDEX IF EXISTS idx_column_translation_jobs_requester_created;
DROP TABLE IF EXISTS column_translation_jobs;

DROP INDEX IF EXISTS idx_columns_translation_status;
ALTER TABLE "columns" DROP COLUMN IF EXISTS translation_status;
