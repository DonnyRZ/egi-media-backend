-- Article translation fixture (migration 008_add_article_translations)
-- Indonesian (id) stays in the base columns. This seed adds optional English (en)
-- and Uzbek (uz) translations to demonstrate the language switcher behaviour:
--   ...201  -> has en AND uz translations (all three locales available)
--   ...202  -> has en translation only (id + en available, uz falls back to id)
--   ...203  -> no translation (id only)

-- Article 201: full translations (en + uz)
UPDATE articles
SET
  title_en = 'How Artificial Intelligence Is Changing Business',
  slug_en = 'how-artificial-intelligence-is-changing-business-en',
  summary_en = 'A look at how artificial intelligence reshapes modern business.',
  content_en = 'Artificial intelligence is changing how businesses analyze data, improve operations, and build products. This is the English translation of the seeded article.',
  title_uz = 'Sunʼiy intellekt biznesni qanday oʻzgartirmoqda',
  slug_uz = 'suniy-intellekt-biznesni-qanday-ozgartirmoqda-uz',
  summary_uz = 'Sunʼiy intellekt zamonaviy biznesni qanday qayta shakllantirayotgani haqida.',
  content_uz = 'Sunʼiy intellekt bizneslarning maʼlumotlarni tahlil qilishi, operatsiyalarni yaxshilashi va mahsulot yaratishini oʻzgartirmoqda. Bu seed maqolasining oʻzbekcha tarjimasi.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000201';

-- Article 202: English translation only
UPDATE articles
SET
  title_en = 'Capital Markets Outlook for the Next Decade',
  slug_en = 'capital-markets-outlook-for-the-next-decade-en',
  summary_en = 'An analysis of long-term trends shaping global capital markets.',
  content_en = 'Capital markets are being reshaped by technology, regulation, and shifting investor behavior. This is the English translation of the seeded article.',
  updated_at = NOW()
WHERE id = '00000000-0000-4000-8000-000000000202';
