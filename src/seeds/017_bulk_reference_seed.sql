-- Bulk reference data seed
-- Ensures each standalone reference table has at least 20 rows for development and testing.
-- Deterministic UUIDs are generated per table to keep the seed idempotent (ON CONFLICT DO NOTHING).
-- Excludes auth/user tables (users, user_profiles) as requested.

-- Categories (20 rows)
INSERT INTO categories (id, name, slug, description, created_at, updated_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((900000000000 + g)::text, 12, '0'))::uuid,
  'Category ' || g::text,
  'category-' || g::text,
  'Seeded category number ' || g::text || ' for development and testing.',
  NOW(),
  NOW()
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Topics (20 rows)
INSERT INTO topics (id, name, slug, description, created_at, updated_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((901000000000 + g)::text, 12, '0'))::uuid,
  'Topic ' || g::text,
  'topic-' || g::text,
  'Seeded topic number ' || g::text || ' for development and testing.',
  NOW(),
  NOW()
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Tags (20 rows)
INSERT INTO tags (id, name, slug, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((902000000000 + g)::text, 12, '0'))::uuid,
  'Tag ' || g::text,
  'tag-' || g::text,
  NOW()
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Series (20 rows) - owned by the default author (00000000-0000-4000-8000-000000000109)
INSERT INTO series (id, name, slug, description, author_id, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((903000000000 + g)::text, 12, '0'))::uuid,
  'Seed Series ' || g::text,
  'seed-series-' || g::text,
  'Seeded series number ' || g::text || ' for development and testing.',
  '00000000-0000-4000-8000-000000000109',
  NOW()
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Subscription plans (20 rows)
INSERT INTO subscription_plans (id, name, description, price, duration_days, is_active, created_at, updated_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((904000000000 + g)::text, 12, '0'))::uuid,
  'Seed Plan ' || g::text,
  'Seeded subscription plan number ' || g::text || '.',
  (10000 + g * 1000)::decimal(12, 2),
  30 * g,
  TRUE,
  NOW(),
  NOW()
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Newsletters (20 rows)
INSERT INTO newsletters (id, name, description, frequency, is_active, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((905000000000 + g)::text, 12, '0'))::uuid,
  'Seed Newsletter ' || g::text,
  'Seeded newsletter number ' || g::text || ' for development and testing.',
  (ARRAY['daily', 'weekly', 'monthly'])[1 + (g % 3)]::newsletter_frequency,
  TRUE,
  NOW() - ((g)::text || ' days')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- YouTube videos (20 rows)
INSERT INTO youtube_videos (id, title, description, url, created_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((906000000000 + g)::text, 12, '0'))::uuid,
  'Seed Video ' || g::text,
  'Seeded YouTube video number ' || g::text || ' for development and testing.',
  'https://www.youtube.com/watch?v=seed' || lpad(g::text, 4, '0'),
  NOW() - ((g)::text || ' days')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;
