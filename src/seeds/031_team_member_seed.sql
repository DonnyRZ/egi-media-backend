-- Team members seed for the public About page (EGI Media Team).
-- photo_url points at static assets shipped with the frontend.

INSERT INTO team_members (
  id, name, role, bio, photo_url, is_active, sort_order, created_at, updated_at
) VALUES
  (
    '00000000-0000-4000-8000-000000003001',
    'Iwel Sastra',
    'Chief Executive Officer & Editorial Board',
    NULL,
    '/images/tim_egi-media/Iwel_sastra.webp',
    TRUE,
    1,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003002',
    'Budimulyanto',
    'Chief Operating Officer & Editorial Board',
    NULL,
    '/images/tim_egi-media/Budimulyanto.webp',
    TRUE,
    2,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003003',
    'Nemo Gusti Dwi Pasopati',
    'Senior Multimedia & Digital Marketing Specialist',
    NULL,
    '/images/tim_egi-media/Nemo_gusti_dwi_pasopati.webp',
    TRUE,
    3,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003004',
    'Amelia Diah Puspita',
    'Creative Research & Event Specialist',
    NULL,
    '/images/tim_egi-media/Amelia_diah_puspita.webp',
    TRUE,
    4,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003005',
    'Ahmad Zidan Ghozali',
    'Podcast & Multimedia Specialist',
    NULL,
    '/images/tim_egi-media/Ahmad_zidan_ghozali.webp',
    TRUE,
    5,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003006',
    'Rio Pramana Putra',
    'Production & Editor',
    NULL,
    '/images/tim_egi-media/Rio_pramana_putra.webp',
    TRUE,
    6,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000003007',
    'Ananda Dewa Nur W.',
    'Production & Multimedia',
    NULL,
    '/images/tim_egi-media/Ananda_dewa_nur_w.webp',
    TRUE,
    7,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;
