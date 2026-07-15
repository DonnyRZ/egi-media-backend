-- Audit logs test fixture
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

-- 2. Seed audit logs
INSERT INTO audit_logs (
  id,
  user_id,
  table_name,
  record_id,
  action,
  old_data,
  new_data,
  ip_address,
  user_agent,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000801',
  '00000000-0000-4000-8000-000000000099',
  'articles',
  '00000000-0000-4000-8000-000000000201',
  'UPDATE',
  '{"status": "draft"}',
  '{"status": "published"}',
  '127.0.0.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO audit_logs (
  id,
  user_id,
  table_name,
  record_id,
  action,
  old_data,
  new_data,
  ip_address,
  user_agent,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000802',
  '00000000-0000-4000-8000-000000000099',
  'newsletters',
  '00000000-0000-4000-8000-000000000401',
  'INSERT',
  NULL,
  '{"name": "Egi Media Daily", "frequency": "daily"}',
  '127.0.0.1',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
