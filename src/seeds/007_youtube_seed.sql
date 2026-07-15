-- YouTube videos test fixture

INSERT INTO youtube_videos (
  id,
  title,
  description,
  url,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000701',
  'Introduction to Egi Media Platform',
  'Learn how Egi Media provides institutional-grade financial and business analytics.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO youtube_videos (
  id,
  title,
  description,
  url,
  created_at
) VALUES (
  '00000000-0000-4000-8000-000000000702',
  'Advanced Analytics Tutorial',
  'Deep dive into our custom data analysis models and real-time news alerts.',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  NOW()
)
ON CONFLICT (id) DO NOTHING;
