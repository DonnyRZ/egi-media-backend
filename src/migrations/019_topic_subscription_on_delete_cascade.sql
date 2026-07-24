-- Migration: 019_topic_subscription_on_delete_cascade
-- Cascade-delete user_topic_subscriptions when a topic is removed.

ALTER TABLE user_topic_subscriptions
  DROP CONSTRAINT IF EXISTS user_topic_subscriptions_topic_id_fkey;

ALTER TABLE user_topic_subscriptions
  ADD CONSTRAINT user_topic_subscriptions_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES topics (id)
  ON DELETE CASCADE
  DEFERRABLE INITIALLY IMMEDIATE;
