-- Rollback: 007_subscription_constraints

DROP INDEX IF EXISTS idx_user_subscriptions_active_expiry;
DROP INDEX IF EXISTS idx_user_subscriptions_user_created_at;
DROP INDEX IF EXISTS idx_subscription_plans_active;
DROP INDEX IF EXISTS uq_user_subscriptions_active_user;
DROP INDEX IF EXISTS uq_subscription_plans_name_lower;

ALTER TABLE user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_payment_reference_not_blank,
  DROP CONSTRAINT IF EXISTS user_subscriptions_expiry_after_start;

ALTER TABLE subscription_plans
  DROP CONSTRAINT IF EXISTS subscription_plans_duration_days_positive,
  DROP CONSTRAINT IF EXISTS subscription_plans_price_positive;

ALTER TABLE user_subscriptions
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN started_at DROP DEFAULT,
  ALTER COLUMN created_at DROP NOT NULL,
  ALTER COLUMN payment_reference DROP NOT NULL,
  ALTER COLUMN status DROP NOT NULL,
  ALTER COLUMN expired_at DROP NOT NULL,
  ALTER COLUMN started_at DROP NOT NULL,
  ALTER COLUMN subscription_plan_id DROP NOT NULL,
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE subscription_plans
  ALTER COLUMN updated_at DROP DEFAULT,
  ALTER COLUMN created_at DROP DEFAULT,
  ALTER COLUMN is_active DROP DEFAULT,
  ALTER COLUMN updated_at DROP NOT NULL,
  ALTER COLUMN created_at DROP NOT NULL,
  ALTER COLUMN is_active DROP NOT NULL,
  ALTER COLUMN duration_days DROP NOT NULL,
  ALTER COLUMN price DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL;
