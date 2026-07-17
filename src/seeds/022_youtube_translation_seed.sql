-- YouTube translation fixture (migration 009_add_youtube_translations)
-- Indonesian (id) stays in the base columns. This seed adds optional English (en)
-- and Uzbek (uz) translations to demonstrate language switcher behaviour:
--   ...0701 -> has en AND uz translations (all three locales available)
--   ...0702 -> has en translation only (id + en available, uz falls back to id)

UPDATE youtube_videos
SET
  title_en = 'Introduction to Egi Media Platform',
  description_en = 'Learn how Egi Media provides institutional-grade financial and business analytics.',
  title_uz = 'Egi Media platformasiga kirish',
  description_uz = 'Egi Media qanday qilib institutsional darajadagi moliyaviy va biznes tahlillarini taqdim etishini o''rganing.'
WHERE id = '00000000-0000-4000-8000-000000000701';

UPDATE youtube_videos
SET
  title_en = 'Advanced Analytics Tutorial',
  description_en = 'Deep dive into our custom data analysis models and real-time news alerts.'
WHERE id = '00000000-0000-4000-8000-000000000702';
