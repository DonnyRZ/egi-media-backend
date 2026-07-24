-- Rollback: 017_create_user_topic_subscriptions

DROP INDEX IF EXISTS idx_user_topic_subscriptions_topic_id;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_topic_subscriptions'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'topic_followers'
  ) THEN
    ALTER TABLE user_topic_subscriptions RENAME TO topic_followers;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'i'
      AND c.relname = 'idx_user_topic_subscriptions_user_id'
      AND n.nspname = 'public'
  ) THEN
    ALTER INDEX idx_user_topic_subscriptions_user_id
      RENAME TO idx_topic_followers_user_id;
  END IF;
END $$;
