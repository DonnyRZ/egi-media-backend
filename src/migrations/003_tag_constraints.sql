CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug_unique ON tags (slug);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);
