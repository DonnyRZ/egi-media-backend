-- Additive: preserve every existing advertisement and its counters.
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_placement_check;
ALTER TABLE ads ADD CONSTRAINT ads_placement_check CHECK (
  placement IN ('LEADERBOARD', 'IN_FEED', 'SIDEBAR_RECTANGLE', 'LATEST_VIDEOS')
);
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_width integer;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_height integer;
ALTER TABLE ads ADD COLUMN IF NOT EXISTS image_receipt text;
ALTER TABLE ads DROP CONSTRAINT IF EXISTS ads_image_dimensions_check;
ALTER TABLE ads ADD CONSTRAINT ads_image_dimensions_check CHECK (
  (image_width IS NULL AND image_height IS NULL)
  OR (image_width IS NOT NULL AND image_height IS NOT NULL AND image_width > 0 AND image_height > 0 AND image_width::bigint * image_height <= 40000000)
);
INSERT INTO ads (id, title, image_url, target_url, placement, is_active)
VALUES
  ('00000000-0000-4000-8000-000000004001', 'Homepage — Atas header', '', '', 'LEADERBOARD', false),
  ('00000000-0000-4000-8000-000000004002', 'Homepage — Berita Terbaru', '', '', 'IN_FEED', false),
  ('00000000-0000-4000-8000-000000004005', 'Homepage — Video Terbaru', '', '', 'LATEST_VIDEOS', false)
ON CONFLICT (placement) DO NOTHING;
