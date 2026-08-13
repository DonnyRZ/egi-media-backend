-- Fixed developer-defined ad slots. Exactly one row per placement.

INSERT INTO ads (
  id, title, image_url, target_url, placement, is_active, clicks, impressions, created_at, updated_at
) VALUES
  (
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
  ),
  (
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
  ),
  (
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
  )
ON CONFLICT (id) DO NOTHING;
