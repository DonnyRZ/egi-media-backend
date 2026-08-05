DROP INDEX IF EXISTS idx_article_translation_jobs_article;
DROP INDEX IF EXISTS idx_article_translation_jobs_status_created;
DROP INDEX IF EXISTS idx_article_translation_jobs_requester_created;
DROP TABLE IF EXISTS article_translation_jobs;
DROP TYPE IF EXISTS article_translation_job_status;

DROP INDEX IF EXISTS idx_articles_translation_status;
ALTER TABLE articles DROP COLUMN IF EXISTS translation_status;
DROP TYPE IF EXISTS article_translation_status;
