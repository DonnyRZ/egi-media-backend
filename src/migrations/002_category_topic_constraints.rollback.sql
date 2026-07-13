BEGIN;

DROP INDEX IF EXISTS idx_topic_followers_user_id;
DROP INDEX IF EXISTS idx_topics_name;
DROP INDEX IF EXISTS idx_categories_name;
DROP INDEX IF EXISTS uq_topics_slug;
DROP INDEX IF EXISTS uq_categories_slug;

COMMIT;
