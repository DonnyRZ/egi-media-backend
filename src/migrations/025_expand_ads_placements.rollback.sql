-- Rollback: 025_expand_ads_placements

UPDATE ads
SET is_active = FALSE
WHERE placement IN ('SIDEBAR_RECTANGLE', 'BOTTOM_BANNER');

ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_placement_check;

ALTER TABLE ads ADD CONSTRAINT ads_placement_check CHECK (
  placement IN ('LEADERBOARD', 'IN_FEED', 'ARTICLE_INLINE')
);
