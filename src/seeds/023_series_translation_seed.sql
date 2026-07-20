-- Series translation fixture (migration 010_add_series_translations)
-- Indonesian (id) stays in the base columns. This seed adds optional English (en)
-- and Uzbek (uz) translations to demonstrate language switcher behaviour:
--   ...0301 -> has en AND uz translations (all three locales available)

UPDATE series
SET
  name_en = 'Artificial Intelligence for Business',
  slug_en = 'artificial-intelligence-for-business-en',
  description_en = 'A curated series about practical artificial intelligence for business.',
  name_uz = 'Biznes uchun sunʼiy intellekt',
  slug_uz = 'biznes-uchun-suniy-intellekt-uz',
  description_uz = 'Biznes uchun amaliy sunʼiy intellekt haqidagi tanlangan seriya.'
WHERE id = '00000000-0000-4000-8000-000000000301';
