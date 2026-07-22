-- Member users test fixture
-- Password for all members: SuperAdmin@123 (bcrypt hash)
-- Logins (plaintext → encrypted with ENCRYPTION_KEY before insert):
--   member-one@example.com
--   member-two@example.com
--   member-three@example.com
-- Emails below are AES-encrypted with the project ENCRYPTION_KEY.

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
) VALUES
  (
    '00000000-0000-4000-8000-000000000111',
    'UEZIGB/YoJMSFLtoz3P2Zl/6PChdbj/Jf6UV4dtMxJM=',
    '$2b$12$JI1Elt32j.OoboSAQw7XPuG/VmzVzLvQkOeHUu4Aon.yI9GJYy2NW',
    'Member One',
    'member',
    'email',
    NOW(),
    NULL,
    NOW(),
    NOW(),
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000000112',
    '1Mm+pNHSjtYHRzWTfytaTonsdYwqWizQYyOINkE+Z1s=',
    '$2b$12$JI1Elt32j.OoboSAQw7XPuG/VmzVzLvQkOeHUu4Aon.yI9GJYy2NW',
    'Member Two',
    'member',
    'email',
    NOW(),
    NULL,
    NOW(),
    NOW(),
    NULL
  ),
  (
    '00000000-0000-4000-8000-000000000113',
    '3RmaOup2LD7+ZyxdangsQJRjGbxda+OMiARApoJhekY=',
    '$2b$12$JI1Elt32j.OoboSAQw7XPuG/VmzVzLvQkOeHUu4Aon.yI9GJYy2NW',
    'Member Three',
    'member',
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
) VALUES
  (
    '00000000-0000-4000-8000-000000000111',
    'https://example.com/member-one.png',
    'Member profile for engagement testing.',
    'Finance',
    'Analyst',
    'Mid',
    'EGI Capital',
    'Indonesia',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000112',
    'https://example.com/member-two.png',
    'Member profile for engagement testing.',
    'Technology',
    'Product Manager',
    'Senior',
    'EGI Labs',
    'Singapore',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000113',
    'https://example.com/member-three.png',
    'Member profile for engagement testing.',
    'Media',
    'Journalist',
    'Junior',
    'EGI Media',
    'Malaysia',
    NOW(),
    NOW()
  )
ON CONFLICT (user_id) DO NOTHING;
