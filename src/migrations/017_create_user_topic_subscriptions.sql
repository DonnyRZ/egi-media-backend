-- Migration: 017_create_user_topic_subscriptions
-- Renames topic_followers → user_topic_subscriptions when present,
-- or creates the junction table fresh.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'topic_followers'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_topic_subscriptions'
  ) THEN
    ALTER TABLE topic_followers RENAME TO user_topic_subscriptions;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_topic_followers_user_id'
      AND n.nspname = 'public'
  ) THEN
    ALTER INDEX idx_topic_followers_user_id
      RENAME TO idx_user_topic_subscriptions_user_id;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_topic_subscriptions (
  topic_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamptz,
  PRIMARY KEY (topic_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_topic_subscriptions_topic_id_fkey'
  ) THEN
    ALTER TABLE user_topic_subscriptions
      ADD CONSTRAINT user_topic_subscriptions_topic_id_fkey
      FOREIGN KEY (topic_id) REFERENCES topics (id)
      ON DELETE CASCADE
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_topic_subscriptions_user_id_fkey'
  ) THEN
    ALTER TABLE user_topic_subscriptions
      ADD CONSTRAINT user_topic_subscriptions_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users (id)
      DEFERRABLE INITIALLY IMMEDIATE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_user_topic_subscriptions_user_id
  ON user_topic_subscriptions (user_id);

CREATE INDEX IF NOT EXISTS idx_user_topic_subscriptions_topic_id
  ON user_topic_subscriptions (topic_id);
