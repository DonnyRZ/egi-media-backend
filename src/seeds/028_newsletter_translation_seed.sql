-- Newsletter translation fixture (migration 013_add_newsletter_translations)
-- Indonesian (id) stays in the base columns. This seed adds optional English (en)
-- and Uzbek (uz) translations to demonstrate language switcher behaviour:
--   ...1401 (Egi Media Daily)  -> has en AND uz translations (all three locales available)
--   ...1402 (Egi Media Weekly) -> has en translation only (id + en available, uz falls back to id)

UPDATE newsletters
SET
  name_en = 'Egi Media Daily',
  description_en = 'A daily digest of the most important business and technology stories.',
  name_uz = 'Egi Media Kunlik',
  description_uz = 'Eng muhim biznes va texnologiya yangiliklarining kunlik sharhi.'
WHERE id = '00000000-0000-4000-8000-000000001401';

UPDATE newsletters
SET
  name_en = 'Egi Media Weekly',
  description_en = 'A weekly roundup of in-depth analysis and market insights.'
WHERE id = '00000000-0000-4000-8000-000000001402';
