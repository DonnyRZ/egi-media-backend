-- Nested column comments (self-referencing parent_id)
ALTER TABLE "column_comments"
  ADD COLUMN IF NOT EXISTS "parent_id" uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'column_comments_parent_id_fkey'
  ) THEN
    ALTER TABLE "column_comments"
      ADD CONSTRAINT "column_comments_parent_id_fkey"
      FOREIGN KEY ("parent_id")
      REFERENCES "column_comments" ("id")
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_column_comments_parent_id"
  ON "column_comments" ("parent_id")
  WHERE "deleted_at" IS NULL;
