-- Additional article fixtures
-- Author: article-author@example.com (00000000-0000-4000-8000-000000000109)
-- Extends the dataset so series, newsletters, and engagement seeds are meaningful.

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
) VALUES
  (
    '00000000-0000-4000-8000-000000000202',
    '00000000-0000-4000-8000-000000000001',
    '00000000-0000-4000-8000-000000000301',
    '00000000-0000-4000-8000-000000000109',
    'Capital Markets Outlook for the Next Decade',
    'capital-markets-outlook-for-the-next-decade',
    'An analysis of long-term trends shaping global capital markets.',
    'Capital markets are being reshaped by technology, regulation, and shifting investor behavior. This seeded article provides a second published record to support list and series API testing.',
    'https://example.com/article-capital-markets.png',
    'published',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days',
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000000203',
    '00000000-0000-4000-8000-000000000002',
    NULL,
    '00000000-0000-4000-8000-000000000109',
    'Building Resilient Startups in a Downturn',
    'building-resilient-startups-in-a-downturn',
    'Practical strategies for startups to survive and grow during economic downturns.',
    'Startups face unique pressures during downturns. This seeded draft article provides a non-published record for status filtering tests.',
    'https://example.com/article-startups.png',
    'draft',
    NULL,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day',
    NULL
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO article_topics (article_id, topic_id)
VALUES
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000012'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000011')
ON CONFLICT (article_id, topic_id) DO NOTHING;

INSERT INTO article_tags (article_id, tag_id)
VALUES
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000021'),
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000022')
ON CONFLICT (article_id, tag_id) DO NOTHING;
