-- Migration: 027_streamline_ads_placements
-- Active public placements: LEADERBOARD, IN_FEED, SIDEBAR_RECTANGLE.

UPDATE ads
SET placement = 'IN_FEED',
    updated_at = NOW()
WHERE placement IN ('ARTICLE_INLINE', 'BOTTOM_BANNER');

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_placement_check;

ALTER TABLE ads ADD CONSTRAINT ads_placement_check CHECK (
  placement IN (
    'LEADERBOARD',
    'IN_FEED',
    'SIDEBAR_RECTANGLE'
  )
);
