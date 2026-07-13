BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_slug ON categories (slug);
CREATE UNIQUE INDEX IF NOT EXISTS uq_topics_slug ON topics (slug);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories (name);
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics (name);
CREATE INDEX IF NOT EXISTS idx_topic_followers_user_id ON topic_followers (user_id);

COMMIT;
