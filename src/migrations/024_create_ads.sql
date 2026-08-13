-- Migration: 024_create_ads
-- Native advertisement inventory for LEADERBOARD, IN_FEED, and ARTICLE_INLINE.

CREATE TABLE IF NOT EXISTS ads (
  id uuid PRIMARY KEY,
  title varchar(200) NOT NULL,
  image_url text NOT NULL,
  target_url text NOT NULL,
  placement varchar(32) NOT NULL,
  is_active boolean NOT NULL DEFAULT TRUE,
  clicks integer NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT ads_placement_check CHECK (
    placement IN ('LEADERBOARD', 'IN_FEED', 'ARTICLE_INLINE')
  ),
  CONSTRAINT ads_clicks_nonneg CHECK (clicks >= 0),
  CONSTRAINT ads_impressions_nonneg CHECK (impressions >= 0)
);

CREATE INDEX IF NOT EXISTS idx_ads_placement_active
  ON ads (placement, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ads_active
  ON ads (is_active);
