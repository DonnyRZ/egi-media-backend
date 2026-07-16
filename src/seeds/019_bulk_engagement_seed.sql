-- Bulk engagement data seed
-- Adds 20 rows each for article_views, article_shares, and saved_articles.
-- Depends on 018_bulk_article_seed.sql (articles 907...) and member users (000000000111/112/113).

-- Article views (20 rows) - seeded articles viewed by rotating member users
INSERT INTO article_views (id, article_id, user_id, ip_address, viewed_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((909000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  '203.0.113.' || (g % 254 + 1)::text,
  NOW() - ((g)::text || ' hours')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Article shares (20 rows) - seeded articles shared by rotating member users
INSERT INTO article_shares (id, article_id, user_id, platform, shared_at)
SELECT
  ('00000000-0000-4000-8000-' || lpad((908000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  (ARRAY['twitter', 'linkedin', 'whatsapp', 'facebook'])[1 + (g % 4)],
  NOW() - ((g)::text || ' hours')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Saved articles (20 rows) - each seeded article saved by a rotating member user
INSERT INTO saved_articles (user_id, article_id, created_at)
SELECT
  ('00000000-0000-4000-8000-0000000001' || lpad((11 + (g % 3))::text, 2, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  NOW() - ((g)::text || ' hours')::interval
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;
