-- Additive editorial release. Run once through the checksum migration runner.
CREATE TABLE category_editorial_slots (
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  slot varchar(20) NOT NULL CHECK (slot IN ('lead','supporting','editors')),
  position smallint NOT NULL CHECK (position BETWEEN 1 AND 5),
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  PRIMARY KEY(category_id, slot, position),
  UNIQUE(category_id, slot, article_id),
  CHECK ((slot <> 'lead' OR position = 1) AND (slot <> 'editors' OR position <= 4))
);
CREATE TABLE video_programs (
  id uuid PRIMARY KEY, name varchar(150) NOT NULL, slug varchar(150) NOT NULL UNIQUE,
  description text, poster_url text, translations jsonb NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE video_collections (
  id uuid PRIMARY KEY, name varchar(150) NOT NULL, slug varchar(150) NOT NULL UNIQUE,
  description text, format varchar(20) NOT NULL CHECK(format IN ('horizontal','short')),
  translations jsonb NOT NULL DEFAULT '{}', sort_order integer NOT NULL DEFAULT 0 CHECK(sort_order >= 0),
  is_active boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE youtube_videos
  ADD COLUMN format varchar(20) NOT NULL DEFAULT 'horizontal' CHECK(format IN ('horizontal','short')),
  ADD COLUMN poster_landscape text, ADD COLUMN poster_portrait text,
  ADD COLUMN duration_seconds integer CHECK(duration_seconds > 0),
  ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN program_id uuid REFERENCES video_programs(id) ON DELETE SET NULL,
  ADD COLUMN episode_number integer CHECK(episode_number > 0);
UPDATE youtube_videos SET format='short'
WHERE url ~ '^https?://(www\.|m\.)?youtube\.com/shorts/[A-Za-z0-9_-]{11}([/?#]|$)';
CREATE INDEX idx_youtube_videos_public_format ON youtube_videos(format,created_at DESC,id) WHERE is_active AND status='published';
CREATE INDEX idx_youtube_videos_category ON youtube_videos(category_id);
CREATE INDEX idx_youtube_videos_program ON youtube_videos(program_id,episode_number);
CREATE TABLE video_collection_items (
  collection_id uuid NOT NULL REFERENCES video_collections(id) ON DELETE CASCADE,
  video_id uuid NOT NULL REFERENCES youtube_videos(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK(position > 0),
  PRIMARY KEY(collection_id,video_id), UNIQUE(collection_id,position)
);
CREATE TABLE video_hub_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton),
  hero_video_id uuid REFERENCES youtube_videos(id) ON DELETE SET NULL
);
INSERT INTO video_hub_settings(singleton) VALUES(true);
ALTER TABLE articles ADD COLUMN featured_image_alt text, ADD COLUMN featured_image_caption text, ADD COLUMN featured_image_credit text;
ALTER TABLE columns ADD COLUMN featured_image_alt text, ADD COLUMN featured_image_caption text, ADD COLUMN featured_image_credit text;

ALTER TABLE columns ADD COLUMN category_id uuid REFERENCES categories(id) ON DELETE SET NULL;
CREATE INDEX idx_columns_category_public ON columns(category_id,published_at DESC) WHERE status='published' AND deleted_at IS NULL;

CREATE INDEX idx_category_editorial_article ON category_editorial_slots(article_id);
CREATE INDEX idx_video_collection_video ON video_collection_items(video_id);
