-- Article test fixture
-- Author login: article-author@example.com / SuperAdmin@123

INSERT INTO users (
  id,
  email,
  password_hash,
  full_name,
  role,
  login_provider,
  email_verified_at,
  last_login_at,
  created_at,
  updated_at,
  deleted_at
) VALUES (
  '00000000-0000-4000-8000-000000000109',
  'article-author@example.com',
  '$2b$12$JI1Elt32j.OoboSAQw7XPuG/VmzVzLvQkOeHUu4Aon.yI9GJYy2NW',
  'Article Author',
  'author',
  'email',
  NOW(),
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  user_id,
  avatar_url,
  bio,
  industry,
  job_title,
  seniority,
  company,
  country,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-8000-000000000109',
  'https://example.com/article-author.png',
  'Author profile for article endpoint testing.',
  'Technology',
  'Editor',
  'Senior',
  'EGI Resources',
  'Indonesia',
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO NOTHING;

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
) VALUES (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000002',
  NULL,
  '00000000-0000-4000-8000-000000000109',
  'How Artificial Intelligence Is Changing Business',
  'how-artificial-intelligence-is-changing-business',
  'A test article covering the impact of artificial intelligence on modern business.',
  'Artificial intelligence is changing how businesses analyze data, improve operations, and build products. This seeded article provides a published record for API testing.',
  'https://example.com/article-featured-image.png',
  'published',
  NOW(),
  NOW(),
  NOW(),
  NULL
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO article_topics (article_id, topic_id)
VALUES (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000011'
)
ON CONFLICT (article_id, topic_id) DO NOTHING;

INSERT INTO article_tags (article_id, tag_id)
VALUES (
  '00000000-0000-4000-8000-000000000201',
  '00000000-0000-4000-8000-000000000022'
)
ON CONFLICT (article_id, tag_id) DO NOTHING;
