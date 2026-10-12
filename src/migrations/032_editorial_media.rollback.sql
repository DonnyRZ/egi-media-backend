ALTER TABLE columns DROP COLUMN category_id;
-- Destructive schema rollback: isolated databases only, or after separately approved recovery.
ALTER TABLE columns DROP COLUMN featured_image_alt, DROP COLUMN featured_image_caption, DROP COLUMN featured_image_credit;
ALTER TABLE articles DROP COLUMN featured_image_alt, DROP COLUMN featured_image_caption, DROP COLUMN featured_image_credit;
DROP TABLE video_hub_settings;
DROP TABLE video_collection_items;
ALTER TABLE youtube_videos DROP COLUMN format, DROP COLUMN poster_landscape, DROP COLUMN poster_portrait,
  DROP COLUMN duration_seconds, DROP COLUMN category_id, DROP COLUMN program_id, DROP COLUMN episode_number;
DROP TABLE video_collections;
DROP TABLE video_programs;
DROP TABLE category_editorial_slots;
