-- Migration: 005_article_indexes
-- Menambahkan index pada tabel articles dan tabel relasi untuk performa query

CREATE INDEX IF NOT EXISTS idx_articles_status
  ON articles (status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_author_id
  ON articles (author_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_category_id
  ON articles (category_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_series_id
  ON articles (series_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_articles_published_at
  ON articles (published_at DESC)
  WHERE deleted_at IS NULL AND status = 'published';

CREATE INDEX IF NOT EXISTS idx_articles_deleted_at
  ON articles (deleted_at);

CREATE INDEX IF NOT EXISTS idx_articles_slug
  ON articles (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_article_topics_topic_id
  ON article_topics (topic_id);

CREATE INDEX IF NOT EXISTS idx_article_tags_tag_id
  ON article_tags (tag_id);

CREATE INDEX IF NOT EXISTS idx_saved_articles_user_id
  ON saved_articles (user_id);

CREATE INDEX IF NOT EXISTS idx_article_shares_article_id
  ON article_shares (article_id);

CREATE INDEX IF NOT EXISTS idx_article_views_article_id
  ON article_views (article_id);
