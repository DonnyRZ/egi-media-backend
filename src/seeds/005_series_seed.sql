-- Series test fixture
-- Owner login: article-author@example.com / SuperAdmin@123

INSERT INTO series (
  id,
  name,
  slug,
  description,
  author_id,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000301',
  'Artificial Intelligence for Business',
  'artificial-intelligence-for-business',
  'A curated series about practical artificial intelligence for business.',
  '00000000-0000-4000-8000-000000000109',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

UPDATE articles
SET series_id = '00000000-0000-4000-8000-000000000301',
    updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000201'
  AND series_id IS NULL;
