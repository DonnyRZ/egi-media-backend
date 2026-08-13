-- Fixed developer-defined ad slots. Exactly one row per placement.

INSERT INTO ads (
  id, title, image_url, target_url, placement, is_active, clicks, impressions, created_at, updated_at
) VALUES
  (
    '00000000-0000-4000-8000-000000004001',
    'Cari Kerja',
    '/images/ads/cari-kerja.png',
    'https://cari-kerja.co.id/',
    'LEADERBOARD',
    TRUE,
    0,
    0,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000004002',
    'Hadith Hotel',
    '/images/ads/hadith-hotel-day.png',
    'https://hadith-hotel.com/',
    'IN_FEED',
    TRUE,
    0,
    0,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000004004',
    'Hadith Hotel',
    '/images/ads/hadith-hotel-night.png',
    'https://hadith-hotel.com/',
    'SIDEBAR_RECTANGLE',
    TRUE,
    0,
    0,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  image_url = EXCLUDED.image_url,
  target_url = EXCLUDED.target_url,
  is_active = TRUE,
  updated_at = NOW();
