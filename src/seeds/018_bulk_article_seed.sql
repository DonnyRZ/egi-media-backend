-- Bulk article data seed
-- Adds 20 articles authored by the default author and links each to a seeded topic and tag.
-- Depends on 017_bulk_reference_seed.sql (categories, topics, tags) and the default author (000000000109).

-- Articles (20 rows) - each references a seeded category and the default author
INSERT INTO articles (
  id,
  category_id,
  series_id,
  author_id,
  title,
  slug,
  summary,
  content,
  featured_image,
  status,
  published_at,
  created_at,
  updated_at,
  deleted_at
)
SELECT
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((900000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((903000000000 + g)::text, 12, '0'))::uuid,
  '00000000-0000-4000-8000-000000000109',
  'Seed Article ' || g::text,
  'seed-article-' || g::text,
  'Seeded summary for article number ' || g::text || '.',
  'Seeded content body for article number ' || g::text || '. This record exists to support development and testing of list, detail, and engagement endpoints.',
  'https://example.com/seed-article-' || g::text || '.png',
  'published',
  NOW() - ((g)::text || ' days')::interval,
  NOW() - ((g)::text || ' days')::interval,
  NOW() - ((g)::text || ' days')::interval,
  NULL
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Article topics (20 pairs) - article g -> topic g
INSERT INTO article_topics (article_id, topic_id)
SELECT
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((901000000000 + g)::text, 12, '0'))::uuid
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;

-- Article tags (20 pairs) - article g -> tag g
INSERT INTO article_tags (article_id, tag_id)
SELECT
  ('00000000-0000-4000-8000-' || lpad((907000000000 + g)::text, 12, '0'))::uuid,
  ('00000000-0000-4000-8000-' || lpad((902000000000 + g)::text, 12, '0'))::uuid
FROM generate_series(1, 20) AS g
ON CONFLICT DO NOTHING;
