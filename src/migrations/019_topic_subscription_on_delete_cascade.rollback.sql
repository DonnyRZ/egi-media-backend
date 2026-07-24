-- Rollback: 019_topic_subscription_on_delete_cascade

ALTER TABLE user_topic_subscriptions
  DROP CONSTRAINT IF EXISTS user_topic_subscriptions_topic_id_fkey;

ALTER TABLE user_topic_subscriptions
  ADD CONSTRAINT user_topic_subscriptions_topic_id_fkey
  FOREIGN KEY (topic_id) REFERENCES topics (id)
  DEFERRABLE INITIALLY IMMEDIATE;
