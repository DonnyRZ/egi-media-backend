-- User subscription test fixture
-- Links members to subscription plans with various statuses.
--   Members: ...111, ...112, ...113
--   Plans:   ...401 (Monthly), ...402 (Quarterly), ...403 (Annual)

INSERT INTO user_subscriptions (
  id,
  user_id,
  subscription_plan_id,
  started_at,
  expired_at,
  status,
  payment_reference,
  created_at
) VALUES
  (
    '00000000-0000-4000-8000-000000001101',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000401',
    NOW() - INTERVAL '5 days',
    NOW() + INTERVAL '25 days',
    'active',
    'PAY-REF-0001',
    NOW() - INTERVAL '5 days'
  ),
  (
    '00000000-0000-4000-8000-000000001102',
    '00000000-0000-4000-8000-000000000112',
    '00000000-0000-4000-8000-000000000403',
    NOW() - INTERVAL '400 days',
    NOW() - INTERVAL '35 days',
    'expired',
    'PAY-REF-0002',
    NOW() - INTERVAL '400 days'
  ),
  (
    '00000000-0000-4000-8000-000000001103',
    '00000000-0000-4000-8000-000000000113',
    '00000000-0000-4000-8000-000000000402',
    NULL,
    NULL,
    'pending',
    'PAY-REF-0003',
    NOW() - INTERVAL '1 hour'
  )
ON CONFLICT (id) DO NOTHING;
