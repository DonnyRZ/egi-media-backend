-- Newsletter test fixture
-- Seeds newsletters, their curated articles, and subscribers.
--   Newsletters: ...1401 (daily), ...1402 (weekly)
--   Articles:    ...201, ...202 (published)
--   Members:     ...111, ...112, ...113

INSERT INTO newsletters (
  id,
  name,
  description,
  frequency,
  is_active,
  created_at
) VALUES
  (
    '00000000-0000-4000-8000-000000001401',
    'Egi Media Daily',
    'A daily digest of the most important business and technology stories.',
    'daily',
    TRUE,
    NOW() - INTERVAL '30 days'
  ),
  (
    '00000000-0000-4000-8000-000000001402',
    'Egi Media Weekly',
    'A weekly roundup of in-depth analysis and market insights.',
    'weekly',
    TRUE,
    NOW() - INTERVAL '30 days'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO newsletter_articles (newsletter_id, article_id, display_order)
VALUES
  (
    '00000000-0000-4000-8000-000000001401',
    '00000000-0000-4000-8000-000000000201',
    1
  ),
  (
    '00000000-0000-4000-8000-000000001401',
    '00000000-0000-4000-8000-000000000202',
    2
  ),
  (
    '00000000-0000-4000-8000-000000001402',
    '00000000-0000-4000-8000-000000000202',
    1
  )
ON CONFLICT (newsletter_id, article_id) DO NOTHING;

INSERT INTO newsletter_subscribers (newsletter_id, user_id, subscribed_at)
VALUES
  (
    '00000000-0000-4000-8000-000000001401',
    '00000000-0000-4000-8000-000000000111',
    NOW() - INTERVAL '20 days'
  ),
  (
    '00000000-0000-4000-8000-000000001401',
    '00000000-0000-4000-8000-000000000112',
    NOW() - INTERVAL '15 days'
  ),
  (
    '00000000-0000-4000-8000-000000001402',
    '00000000-0000-4000-8000-000000000113',
    NOW() - INTERVAL '10 days'
  )
ON CONFLICT (newsletter_id, user_id) DO NOTHING;
