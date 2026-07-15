-- Subscription plan fixtures

INSERT INTO subscription_plans (
  id,
  name,
  description,
  price,
  duration_days,
  is_active,
  created_at,
  updated_at
) VALUES
  (
    '00000000-0000-4000-8000-000000000401',
    'Member Monthly',
    'Full member access for 30 days.',
    49000,
    30,
    TRUE,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    'Member Quarterly',
    'Full member access for 90 days.',
    129000,
    90,
    TRUE,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    'Member Annual',
    'Full member access for 365 days.',
    499000,
    365,
    TRUE,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
