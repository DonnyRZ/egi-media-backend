-- Migration: 007_subscription_constraints
-- Menambahkan constraint dan index untuk subscription plans dan user subscriptions.

ALTER TABLE subscription_plans
  ALTER COLUMN name SET NOT NULL,
  ALTER COLUMN price SET NOT NULL,
  ALTER COLUMN duration_days SET NOT NULL,
  ALTER COLUMN is_active SET NOT NULL,
  ALTER COLUMN is_active SET DEFAULT TRUE,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW(),
  ALTER COLUMN updated_at SET NOT NULL,
  ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE user_subscriptions
  ALTER COLUMN user_id SET NOT NULL,
  ALTER COLUMN subscription_plan_id SET NOT NULL,
  ALTER COLUMN started_at SET NOT NULL,
  ALTER COLUMN started_at SET DEFAULT NOW(),
  ALTER COLUMN expired_at SET NOT NULL,
  ALTER COLUMN status SET NOT NULL,
  ALTER COLUMN payment_reference SET NOT NULL,
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE subscription_plans
  ADD CONSTRAINT subscription_plans_price_positive CHECK (price > 0),
  ADD CONSTRAINT subscription_plans_duration_days_positive CHECK (duration_days > 0);

ALTER TABLE user_subscriptions
  ADD CONSTRAINT user_subscriptions_expiry_after_start CHECK (expired_at > started_at),
  ADD CONSTRAINT user_subscriptions_payment_reference_not_blank CHECK (length(trim(payment_reference)) > 0);

CREATE UNIQUE INDEX uq_subscription_plans_name_lower
  ON subscription_plans (LOWER(name));

CREATE UNIQUE INDEX uq_user_subscriptions_active_user
  ON user_subscriptions (user_id)
  WHERE status = 'active';

CREATE INDEX idx_subscription_plans_active
  ON subscription_plans (is_active, name)
  WHERE is_active = TRUE;

CREATE INDEX idx_user_subscriptions_user_created_at
  ON user_subscriptions (user_id, created_at DESC);

CREATE INDEX idx_user_subscriptions_active_expiry
  ON user_subscriptions (user_id, expired_at)
  WHERE status = 'active';
