-- Add one fixed landscape placement without changing existing campaigns or counters.
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_placement_check;
ALTER TABLE ads ADD CONSTRAINT ads_placement_check CHECK (
  placement IN ('LEADERBOARD', 'HERO_BELOW', 'IN_FEED', 'SIDEBAR_RECTANGLE', 'LATEST_VIDEOS')
);

INSERT INTO ads (id, title, image_url, target_url, placement, is_active)
VALUES (
  '00000000-0000-4000-8000-000000004006',
  'Homepage — Below main story', '', '', 'HERO_BELOW', false
)
ON CONFLICT (placement) DO NOTHING;
