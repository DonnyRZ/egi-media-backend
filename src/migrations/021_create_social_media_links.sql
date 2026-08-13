-- Migration: 021_create_social_media_links
-- CMS-managed social profile links for the public footer.

CREATE TABLE IF NOT EXISTS social_media_links (
  id uuid PRIMARY KEY,
  platform_name varchar(100) NOT NULL,
  url text NOT NULL,
  icon_name varchar(50) NOT NULL,
  is_active boolean NOT NULL DEFAULT TRUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_media_links_active_sort
  ON social_media_links (is_active, sort_order ASC, platform_name ASC);

CREATE INDEX IF NOT EXISTS idx_social_media_links_sort_order
  ON social_media_links (sort_order ASC);
