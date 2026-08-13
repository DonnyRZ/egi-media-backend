-- Social media links seed for public footer + CMS settings.
-- icon_name must match frontend SocialIcon platform keys.

INSERT INTO social_media_links (
  id, platform_name, url, icon_name, is_active, sort_order, created_at, updated_at
) VALUES
  (
    '00000000-0000-4000-8000-000000002001',
    'YouTube',
    'https://www.youtube.com/@egimediaofficial',
    'youtube',
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000002002',
    'Instagram',
    'https://www.instagram.com/',
    'instagram',
    TRUE,
    2,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000002003',
    'TikTok',
    'https://www.tiktok.com/',
    'tiktok',
    TRUE,
    3,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000002004',
    'Spotify',
    'https://open.spotify.com/',
    'spotify',
    TRUE,
    4,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000002005',
    'X',
    'https://x.com/',
    'twitter',
    TRUE,
    5,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
