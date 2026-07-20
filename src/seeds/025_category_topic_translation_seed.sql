-- Category & topic translation fixture (migration 012)
-- Indonesian (id) stays in the base columns.
--   categories ...0001 (Business)  -> en + uz
--   categories ...0002 (Technology) -> en only
--   topics ...0011 (AI)            -> en + uz
--   topics ...0012 (Capital Markets) -> en only

UPDATE categories
SET
  name_en = 'Business',
  slug_en = 'business-en',
  description_en = 'Business news and analysis.',
  name_uz = 'Biznes',
  slug_uz = 'biznes-uz',
  description_uz = 'Biznes yangiliklari va tahlillari.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000001';

UPDATE categories
SET
  name_en = 'Technology',
  slug_en = 'technology-en',
  description_en = 'Technology news and analysis.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000002';

UPDATE topics
SET
  name_en = 'Artificial Intelligence',
  slug_en = 'artificial-intelligence-en',
  description_en = 'Artificial intelligence coverage.',
  name_uz = 'Sunʼiy intellekt',
  slug_uz = 'suniy-intellekt-uz',
  description_uz = 'Sunʼiy intellekt haqidagi materiallar.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000011';

UPDATE topics
SET
  name_en = 'Capital Markets',
  slug_en = 'capital-markets-en',
  description_en = 'Capital markets coverage.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000012';
