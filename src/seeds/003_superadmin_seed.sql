-- Superadmin Seed
-- Password: SuperAdmin@123 (bcrypt hash)
-- IMPORTANT: Change the password after first login in production!

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
  '00000000-0000-4000-8000-000000000099',
  'superadmin@egimedia.com',
  '$2b$12$1JrYK.RZAjb3CogWQRsipu2m3O.VAdYpf./j6aQeZGu9skcWcOLju',
  'Super Admin',
  'superadmin',
  'email',
  NOW(),
  NULL,
  NOW(),
  NOW(),
  NULL
)
ON CONFLICT (email) DO NOTHING;
