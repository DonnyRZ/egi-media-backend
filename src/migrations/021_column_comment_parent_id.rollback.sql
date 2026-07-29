DROP INDEX IF EXISTS "idx_column_comments_parent_id";

ALTER TABLE "column_comments"
  DROP CONSTRAINT IF EXISTS "column_comments_parent_id_fkey";

ALTER TABLE "column_comments"
  DROP COLUMN IF EXISTS "parent_id";
