-- Migration: 014_create_columns
-- Opinion/column feature (Kompas-style). No category/topic/series relations.
-- Indonesian (id) is primary in base columns; en/uz are optional translations.
-- Members and authors write columns; only superadmin can approve/reject.

CREATE TYPE "column_status" AS ENUM (
  'draft',
  'pending_approval',
  'rejected',
  'published',
  'archived'
);

CREATE TABLE "columns" (
  "id" uuid PRIMARY KEY,
  "author_id" uuid NOT NULL,
  "title" varchar(255) NOT NULL,
  "slug" varchar(255) NOT NULL,
  "summary" text,
  "content" text NOT NULL,
  "featured_image" text,
  "title_en" varchar(255),
  "slug_en" varchar(255),
  "summary_en" text,
  "content_en" text,
  "title_uz" varchar(255),
  "slug_uz" varchar(255),
  "summary_uz" text,
  "content_uz" text,
  "status" column_status NOT NULL DEFAULT 'draft',
  "rejection_reason" text,
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "published_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW(),
  "deleted_at" timestamptz
);

ALTER TABLE "columns"
  ADD CONSTRAINT "columns_author_id_fkey"
  FOREIGN KEY ("author_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "columns"
  ADD CONSTRAINT "columns_reviewed_by_fkey"
  FOREIGN KEY ("reviewed_by") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS idx_columns_status
  ON "columns" (status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_author_id
  ON "columns" (author_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_published_at
  ON "columns" (published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_deleted_at
  ON "columns" (deleted_at);

CREATE INDEX IF NOT EXISTS idx_columns_slug
  ON "columns" (slug)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_columns_slug_en
  ON "columns" (slug_en)
  WHERE deleted_at IS NULL AND slug_en IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_columns_slug_uz
  ON "columns" (slug_uz)
  WHERE deleted_at IS NULL AND slug_uz IS NOT NULL;

CREATE TABLE "column_views" (
  "id" uuid PRIMARY KEY,
  "column_id" uuid NOT NULL,
  "user_id" uuid,
  "ip_address" varchar(64),
  "viewed_at" timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE "column_views"
  ADD CONSTRAINT "column_views_column_id_fkey"
  FOREIGN KEY ("column_id") REFERENCES "columns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "column_views"
  ADD CONSTRAINT "column_views_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS idx_column_views_column_id
  ON "column_views" (column_id);

CREATE TABLE "column_shares" (
  "id" uuid PRIMARY KEY,
  "column_id" uuid NOT NULL,
  "user_id" uuid,
  "platform" varchar(50) NOT NULL,
  "shared_at" timestamptz NOT NULL DEFAULT NOW()
);

ALTER TABLE "column_shares"
  ADD CONSTRAINT "column_shares_column_id_fkey"
  FOREIGN KEY ("column_id") REFERENCES "columns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "column_shares"
  ADD CONSTRAINT "column_shares_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS idx_column_shares_column_id
  ON "column_shares" (column_id);

CREATE TABLE "saved_columns" (
  "user_id" uuid NOT NULL,
  "column_id" uuid NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "column_id")
);

ALTER TABLE "saved_columns"
  ADD CONSTRAINT "saved_columns_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "saved_columns"
  ADD CONSTRAINT "saved_columns_column_id_fkey"
  FOREIGN KEY ("column_id") REFERENCES "columns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS idx_saved_columns_user_id
  ON "saved_columns" (user_id);

CREATE TABLE "column_comments" (
  "id" uuid PRIMARY KEY,
  "column_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "content" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT NOW(),
  "updated_at" timestamptz NOT NULL DEFAULT NOW(),
  "deleted_at" timestamptz
);

ALTER TABLE "column_comments"
  ADD CONSTRAINT "column_comments_column_id_fkey"
  FOREIGN KEY ("column_id") REFERENCES "columns" ("id") DEFERRABLE INITIALLY IMMEDIATE;

ALTER TABLE "column_comments"
  ADD CONSTRAINT "column_comments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX IF NOT EXISTS idx_column_comments_column_id
  ON "column_comments" (column_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_column_comments_user_id
  ON "column_comments" (user_id)
  WHERE deleted_at IS NULL;
