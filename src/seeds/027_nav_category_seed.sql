-- Navigation hub categories used by the public site header.
-- Stable slugs (shared across locales) so /categories/business etc. work in all languages.
-- Indonesian remains the default locale in base columns.

INSERT INTO categories (
  id, name, slug, description,
  name_en, slug_en, description_en,
  name_uz, slug_uz, description_uz,
  created_at, updated_at
)
VALUES
  (
    '00000000-0000-4000-8000-000000000031',
    'Bisnis',
    'business',
    'Liputan bisnis, pasar, dan ekonomi dari ruang redaksi EGI Media.',
    'Business',
    'business',
    'Business, markets, and economic coverage from the EGI Media newsroom.',
    'Biznes',
    'business',
    'EGI Media tahririyatidan biznes, bozor va iqtisodiyot reportajlari.',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000032',
    'Teknologi',
    'technology',
    'Perkembangan teknologi, inovasi digital, dan dampaknya bagi industri.',
    'Technology',
    'technology',
    'Technology developments, digital innovation, and their impact on industry.',
    'Texnologiya',
    'technology',
    'Texnologiya rivoji, raqamli innovatsiyalar va ularning sanoatga taʼsiri.',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000033',
    'Politik',
    'politics',
    'Analisis politik, kebijakan publik, dan dinamika pemerintahan.',
    'Politics',
    'politics',
    'Political analysis, public policy, and governance developments.',
    'Siyosat',
    'politics',
    'Siyosiy tahlil, davlat siyosati va boshqaruv dinamikasi.',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-8000-000000000034',
    'Berita EGI',
    'egi-news',
    'Berita internal dan pengumuman resmi dari EGI Media.',
    'EGI News',
    'egi-news',
    'Internal news and official announcements from EGI Media.',
    'EGI Yangiliklari',
    'egi-news',
    'EGI Mediadan ichki yangiliklar va rasmiy eʼlonlar.',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  description = EXCLUDED.description,
  name_en = EXCLUDED.name_en,
  slug_en = EXCLUDED.slug_en,
  description_en = EXCLUDED.description_en,
  name_uz = EXCLUDED.name_uz,
  slug_uz = EXCLUDED.slug_uz,
  description_uz = EXCLUDED.description_uz,
  updated_at = NOW();

-- Assign published articles across the four nav categories for sample coverage.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (ORDER BY published_at DESC NULLS LAST, created_at DESC) AS rn
  FROM articles
  WHERE status = 'published'
    AND deleted_at IS NULL
),
mapped AS (
  SELECT
    ranked.id AS article_id,
    CASE (ranked.rn % 4)
      WHEN 1 THEN '00000000-0000-4000-8000-000000000031'::uuid
      WHEN 2 THEN '00000000-0000-4000-8000-000000000032'::uuid
      WHEN 3 THEN '00000000-0000-4000-8000-000000000033'::uuid
      ELSE '00000000-0000-4000-8000-000000000034'::uuid
    END AS category_id
  FROM ranked
)
UPDATE articles AS a
SET
  category_id = mapped.category_id,
  updated_at = NOW()
FROM mapped
WHERE a.id = mapped.article_id;
