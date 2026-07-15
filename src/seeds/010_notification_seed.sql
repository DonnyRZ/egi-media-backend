-- Notifications test fixture
-- Superadmin ID: 00000000-0000-4000-8000-000000000099

-- 1. Ensure the superadmin user exists for the foreign key reference
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
  '00000000-0000-4000-8000-000000000099',
  'superadmin@egimedia.com',
  '$2b$12$1JrYK.RZAjb3CogWQRsipu2m3O.VAdYpf./j6aQeZGu9skcWcOLju',
  'Super Admin',
  'superadmin',
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Seed notifications
INSERT INTO notifications (
  id,
  user_id,
  title,
  message,
  channel,
  status,
  sent_at,
  read_at,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-4000-8000-000000000099',
  'Welcome to Egi Media!',
  'Thank you for registering on our platform. Explore premium business analytics today.',
  'in_app',
  'read',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO notifications (
  id,
  user_id,
  title,
  message,
  channel,
  status,
  sent_at,
  read_at,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000902',
  '00000000-0000-4000-8000-000000000099',
  'New Premium Article Available',
  'Read our latest deep-dive analysis on AI in Business.',
  'email',
  'sent',
  NOW() - INTERVAL '1 hour',
  NULL,
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;
