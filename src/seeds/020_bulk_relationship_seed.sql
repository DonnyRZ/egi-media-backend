-- Bulk relationship data seed
-- Adds at least 20 rows each for author_followers, topic_followers, user_subscriptions,
-- newsletter_articles, newsletter_subscribers, notifications, and audit_logs.
-- Depends on 017-019 seeds and the existing users:
--   superadmin (000000000099), author (000000000109), members (000000000111/112/113).

-- Author followers (20 rows) - every ordered pair of the 5 existing users (5 x 4 = 20)
WITH seed_users AS (
  SELECT unnest(ARRAY[
    '00000000-0000-4000-8000-000000000099',
    '00000000-0000-4000-8000-000000000109',
    '00000000-0000-4000-8000-000000000111',
    '00000000-0000-4000-8000-000000000112',
    '00000000-0000-4000-8000-000000000113'
  ]::uuid[]) AS id
)
INSERT INTO author_followers (author_id, follower_id, created_at)
SELECT a.id, f.id, NOW() - '1 day'::interval
FROM seed_users a
CROSS JOIN seed_users f
WHERE a.id <> f.id
ON CONFLICT DO NOTHING;

-- Topic followers (20 rows) - each seeded topic followed by a rotating member user
INSERT INTO topic_followers (topic_id, user_id, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((901000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  NOW() - ((g)::text || ' days')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- User subscriptions (20 rows) - rotating members and seeded plans.
-- Statuses are limited to non-active values to respect the unique active-subscription-per-user index.
INSERT INTO user_subscriptions (
  id,
  user_id,
  subscription_plan_id,
  started_at,
  expired_at,
  status,
  payment_reference,
  created_at
)
SELECT
  ('00000000-0000-4000-8000-' || lpad((912000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((904000000000 + g)::text, 12, '0'))::uuid,
  NOW() - ((g + 60)::text || ' days')::interval,
  NOW() - ((g)::text || ' days')::interval,
  (ARRAY['expired', 'cancelled', 'pending'])[1 + (g % 3)]::subscription_status,
  'PAY-REF-SEED-' || lpad(g::text, 4, '0'),
  NOW() - ((g + 60)::text || ' days')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Newsletter articles (20 rows) - seeded newsletter g curates seeded article g
INSERT INTO newsletter_articles (newsletter_id, article_id, display_order)
SELECT
  ('00000000-0000-4000-8000-' || lpad((905000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  g
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Newsletter subscribers (20 rows) - each seeded newsletter subscribed to by a rotating member
INSERT INTO newsletter_subscribers (newsletter_id, user_id, subscribed_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((905000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  NOW() - ((g)::text || ' days')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Notifications (20 rows) - rotating member recipients, rotating channel/status
INSERT INTO notifications (id, user_id, title, message, channel, status, sent_at, read_at, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((910000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  'Seed Notification ' || g::text,
  'Seeded notification message number ' || g::text || ' for development and testing.',
  (ARRAY['in_app', 'email'])[1 + (g % 2)]::notification_channel,
  (ARRAY['pending', 'sent', 'read', 'failed'])[1 + (g % 4)]::notification_status,
  NOW() - ((g)::text || ' hours')::interval,
  NULL,
  NOW() - ((g)::text || ' hours')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Audit logs (20 rows) - actions attributed to superadmin/author against seeded articles
INSERT INTO audit_logs (
  id,
  user_id,
  table_name,
  record_id,
  action,
  old_data,
  new_data,
  ip_address,
  user_agent,
  created_at
)
SELECT
  ('00000000-0000-4000-8000-' || lpad((911000000000 + g)::text, 12, '0'))::uuid,
  (ARRAY[
    '00000000-0000-4000-8000-000000000099',
    '00000000-0000-4000-8000-000000000109'
  ])[1 + (g % 2)]::uuid,
  'articles',
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  (ARRAY['INSERT', 'UPDATE', 'DELETE'])[1 + (g % 3)],
  ('{"seed": true, "n": ' || g::text || '}')::json,
  ('{"seed": true, "n": ' || g::text || ', "status": "published"}')::json,
  '127.0.0.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  NOW() - ((g)::text || ' hours')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;
