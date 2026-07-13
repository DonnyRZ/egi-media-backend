INSERT INTO categories (id, name, slug, description, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'Business', 'business', 'Business news and analysis.', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000002', 'Technology', 'technology', 'Technology news and analysis.', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

INSERT INTO topics (id, name, slug, description, created_at, updated_at)
VALUES
  ('00000000-0000-4000-8000-000000000011', 'Artificial Intelligence', 'artificial-intelligence', 'Artificial intelligence coverage.', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000012', 'Capital Markets', 'capital-markets', 'Capital markets coverage.', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;
