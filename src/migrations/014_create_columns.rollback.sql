-- Rollback: 014_create_columns

DROP INDEX IF EXISTS idx_column_comments_user_id;
DROP INDEX IF EXISTS idx_column_comments_column_id;
DROP TABLE IF EXISTS "column_comments";

DROP INDEX IF EXISTS idx_saved_columns_user_id;
DROP TABLE IF EXISTS "saved_columns";

DROP INDEX IF EXISTS idx_column_shares_column_id;
DROP TABLE IF EXISTS "column_shares";

DROP INDEX IF EXISTS idx_column_views_column_id;
DROP TABLE IF EXISTS "column_views";

DROP INDEX IF EXISTS idx_columns_slug_uz;
DROP INDEX IF EXISTS idx_columns_slug_en;
DROP INDEX IF EXISTS idx_columns_slug;
DROP INDEX IF EXISTS idx_columns_deleted_at;
DROP INDEX IF EXISTS idx_columns_published_at;
DROP INDEX IF EXISTS idx_columns_author_id;
DROP INDEX IF EXISTS idx_columns_status;
DROP TABLE IF EXISTS "columns";

DROP TYPE IF EXISTS "column_status";
