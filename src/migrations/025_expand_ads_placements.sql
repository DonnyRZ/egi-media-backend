-- Migration: 025_expand_ads_placements
-- Add SIDEBAR_RECTANGLE and BOTTOM_BANNER placements.

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_placement_check;

ALTER TABLE ads ADD CONSTRAINT ads_placement_check CHECK (
  placement IN (
    'LEADERBOARD',
    'IN_FEED',
    'ARTICLE_INLINE',
    'SIDEBAR_RECTANGLE',
    'BOTTOM_BANNER'
  )
);
