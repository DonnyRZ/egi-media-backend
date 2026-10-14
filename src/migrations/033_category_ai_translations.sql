-- Track manual/AI translation provenance per category field and durable AI jobs.
CREATE TABLE category_translation_state (
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  locale varchar(2) NOT NULL CHECK (locale IN ('en', 'uz')),
  name_origin varchar(10) CHECK (name_origin IN ('manual', 'ai')),
  description_origin varchar(10) CHECK (description_origin IN ('manual', 'ai')),
  name_source_text text,
  description_source_text text,
  status article_translation_status NOT NULL DEFAULT 'none',
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (category_id, locale)
);

INSERT INTO category_translation_state (
  category_id, locale, name_origin, description_origin, status
)
SELECT id, 'en',
       CASE WHEN NULLIF(BTRIM(name_en), '') IS NOT NULL THEN 'manual' END,
       CASE WHEN NULLIF(BTRIM(description_en), '') IS NOT NULL THEN 'manual' END,
       CASE WHEN NULLIF(BTRIM(name_en), '') IS NOT NULL THEN 'ready'::article_translation_status
            ELSE 'none'::article_translation_status END
FROM categories
UNION ALL
SELECT id, 'uz',
       CASE WHEN NULLIF(BTRIM(name_uz), '') IS NOT NULL THEN 'manual' END,
       CASE WHEN NULLIF(BTRIM(description_uz), '') IS NOT NULL THEN 'manual' END,
       CASE WHEN NULLIF(BTRIM(name_uz), '') IS NOT NULL THEN 'ready'::article_translation_status
            ELSE 'none'::article_translation_status END
FROM categories;

CREATE TABLE category_translation_jobs (
  id uuid PRIMARY KEY,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES users(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  source_description text NOT NULL DEFAULT '',
  targets jsonb NOT NULL,
  job_status article_translation_job_status NOT NULL DEFAULT 'queued',
  error_message text,
  bull_job_id varchar(100),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  started_at timestamptz,
  finished_at timestamptz
);

CREATE INDEX idx_category_translation_jobs_category
  ON category_translation_jobs (category_id, created_at DESC);
CREATE INDEX idx_category_translation_jobs_status
  ON category_translation_jobs (job_status, created_at DESC);
