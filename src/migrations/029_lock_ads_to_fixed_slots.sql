-- Migration: 029_lock_ads_to_fixed_slots
-- Exactly one ad row per developer-defined placement.

DELETE FROM ads
WHERE placement NOT IN ('LEADERBOARD', 'IN_FEED', 'SIDEBAR_RECTANGLE');

DELETE FROM ads
WHERE id IN (
  SELECT id
  FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (
        PARTITION BY placement
        ORDER BY updated_at DESC NULLS LAST, created_at DESC NULLS LAST, id ASC
      ) AS rn
    FROM ads
  ) ranked
  WHERE ranked.rn > 1
);

INSERT INTO ads (
  id, title, image_url, target_url, placement, is_active, clicks, impressions, created_at, updated_at
)
SELECT
  '00000000-0000-4000-8000-000000004001',
  'EGI Media Premium Briefing',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=120&fit=crop',
  'https://egi-media.com',
  'LEADERBOARD',
  TRUE,
  0,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE placement = 'LEADERBOARD');

INSERT INTO ads (
  id, title, image_url, target_url, placement, is_active, clicks, impressions, created_at, updated_at
)
SELECT
  '00000000-0000-4000-8000-000000004002',
  'Market Desk Sponsored Insight',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop',
  'https://egi-media.com/about',
  'IN_FEED',
  TRUE,
  0,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE placement = 'IN_FEED');

INSERT INTO ads (
  id, title, image_url, target_url, placement, is_active, clicks, impressions, created_at, updated_at
)
SELECT
  '00000000-0000-4000-8000-000000004004',
  'Sidebar Partner Offer',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=300&h=250&fit=crop',
  'https://egi-media.com/about',
  'SIDEBAR_RECTANGLE',
  TRUE,
  0,
  0,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM ads WHERE placement = 'SIDEBAR_RECTANGLE');

CREATE UNIQUE INDEX IF NOT EXISTS idx_ads_placement_unique
  ON ads (placement);
