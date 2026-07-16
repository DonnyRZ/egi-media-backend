-- Follower relationships test fixture
-- Members follow the article author and topics.
--   Author:  00000000-0000-4000-8000-000000000109
--   Members: ...111, ...112, ...113
--   Topics:  ...011 (Artificial Intelligence), ...012 (Capital Markets)

INSERT INTO author_followers (author_id, follower_id, created_at)
VALUES
  (
    '00000000-0000-4000-8000-000000000109',
    '00000000-0000-4000-8000-000000000111',
    NOW() - INTERVAL '10 days'
  ),
  (
    '00000000-0000-4000-8000-000000000109',
    '00000000-0000-4000-8000-000000000112',
    NOW() - INTERVAL '5 days'
  )
ON CONFLICT (author_id, follower_id) DO NOTHING;

INSERT INTO topic_followers (topic_id, user_id, created_at)
VALUES
  (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000111',
    NOW() - INTERVAL '10 days'
  ),
  (
    '00000000-0000-4000-8000-000000000011',
    '00000000-0000-4000-8000-000000000113',
    NOW() - INTERVAL '2 days'
  ),
  (
    '00000000-0000-4000-8000-000000000012',
    '00000000-0000-4000-8000-000000000112',
    NOW() - INTERVAL '7 days'
  )
ON CONFLICT (topic_id, user_id) DO NOTHING;
