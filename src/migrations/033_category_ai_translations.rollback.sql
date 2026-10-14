DO $revoke$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'egi_cms_app') THEN
    EXECUTE 'REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLE category_translation_jobs, category_translation_state FROM egi_cms_app';
  END IF;
END
$revoke$;
DROP INDEX IF EXISTS idx_category_translation_jobs_status;
DROP INDEX IF EXISTS idx_category_translation_jobs_category;
DROP TABLE IF EXISTS category_translation_jobs;
DROP TABLE IF EXISTS category_translation_state;
