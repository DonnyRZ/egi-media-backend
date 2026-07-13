INSERT INTO tags (id, name, slug, created_at)
VALUES
  ('00000000-0000-4000-8000-000000000021', 'Economy', 'economy', NOW()),
  ('00000000-0000-4000-8000-000000000022', 'Startups', 'startups', NOW())
ON CONFLICT (slug) DO NOTHING;
