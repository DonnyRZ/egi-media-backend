-- Seeder for migration 006_add_series_author.sql
-- Assigns a default author to existing series to satisfy the NOT NULL constraint, and ensures default data is present.
-- Owner login: article-author@example.com / SuperAdmin@123

-- 1. Ensure the default author user exists
INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  login_provider,
  email_verified_at,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000109',
  'article-author@example.com',
  '$2b$12$JI1Elt32j.OoboSAQw7XPuG/VmzVzLvQkOeHUu4Aon.yI9GJYy2NW',
  'Article Author',
  'author',
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Update any existing series that might have NULL author_id to use the default author
UPDATE series
SET author_id = '00000000-0000-4000-8000-000000000109'
WHERE author_id IS NULL;

-- 3. Seed a default series if there are none
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
