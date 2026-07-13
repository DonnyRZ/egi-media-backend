-- Rollback: 005_article_indexes

DROP INDEX IF EXISTS idx_articles_status;
DROP INDEX IF EXISTS idx_articles_author_id;
DROP INDEX IF EXISTS idx_articles_category_id;
DROP INDEX IF EXISTS idx_articles_series_id;
DROP INDEX IF EXISTS idx_articles_published_at;
DROP INDEX IF EXISTS idx_articles_deleted_at;
DROP INDEX IF EXISTS idx_articles_slug;
DROP INDEX IF EXISTS idx_article_topics_topic_id;
DROP INDEX IF EXISTS idx_article_tags_tag_id;
DROP INDEX IF EXISTS idx_saved_articles_user_id;
DROP INDEX IF EXISTS idx_article_shares_article_id;
DROP INDEX IF EXISTS idx_article_views_article_id;
